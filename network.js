const loadData = d3.json("./network.json").then((data) => {
    function ticked() {
        node_elements.attr("transform", (d) => `translate(${d.x},${d.y})`);
        link_elements
            .attr("x1", (d) => d.source.x)
            .attr("x2", (d) => d.target.x)
            .attr("y1", (d) => d.source.y)
            .attr("y2", (d) => d.target.y);
    }

    function zoomed({transform}) {
        main_group.attr("transform", transform);
    }

    let svg = d3.select('svg')
    const main_group = svg.append('g').attr('transform', `translate(0, 50)`)

    let width = parseInt(svg.attr("viewBox").split(" ")[2]);
    let height = parseInt(svg.attr("viewBox").split(" ")[3]);

    const node_degree = {};
    d3.map(data.links, (d) => {
        if (d.source in node_degree) {
            node_degree[d.source]++;
        } else {
            node_degree[d.source] = 0;
        }
        if (d.target in node_degree) {
            node_degree[d.target]++;
        } else {
            node_degree[d.target] = 0;
        }
    });

    const arr = Object.values(node_degree);
    const min_node_degree = Math.min(...arr);
    const max_node_degree = Math.max(...arr);

    const scale_radius = d3
        .scaleLinear()
        .domain(d3.extent(Object.values(node_degree)))
        .range([5, 20]);

    const scale_link_stroke_width = d3
        .scaleLinear()
        .domain([min_node_degree, max_node_degree])
        .range([1, 5]);

    const color_list = [
        "#FF5733", "#45B8AC", "#9F44D3", "#67C7EB", "#FFA500", "#3E4095",
        "#7FFF00", "#FFD700", "#4CAF50", "#9C27B0", "#2E8B57", "#FF6347",
        "#00FFFF", "#8A2BE2", "#32CD32", "#FF69B4", "#00FA9A", "#8B4513",
        "#1E90FF", "#DAA520", "#008080", "#9932CC", "#556B2F", "#FF4500",
        "#00CED1", "#8B008B", "#6B8E23", "#FF8C00", "#1E90FF", "#20B2AA",
        "#FF1493", "#808000", "#B0C4DE", "#FFD700", "#2F4F4F", "#8B0000",
        "#008B8B", "#A52A2A", "#7B68EE", "#228B22", "#800000", "#4682B4",
        "#00FF7F", "#CD853F", "#BDB76B", "#ADFF2F", "#FF00FF", "#FF4500",
        "#4B0082", "#87CEEB", "#8B4513", "#9400D3", "#32CD32", "#9932CC",
        "#B8860B", "#8A2BE2", "#228B22", "#FFA07A", "#48D1CC", "#800080",
        "#2F4F4F", "#FA8072", "#6495ED", "#006400", "#8B008B", "#8B0000"
    ];

    const color = d3.scaleOrdinal(color_list);

    const link_elements = main_group
        .append("g")
        .attr("transform", `translate(${width / 4},${height / 4})`)
        .selectAll(".line")
        .data(data.links)
        .enter()
        .append("line")
        .style("stroke-width", (d) => scale_link_stroke_width(10))
        .style("stroke", (d) => {return "steelblue"});

    let div = document.getElementById('tooltipdiv');

    const node_elements = main_group
        .append("g")
        .attr("transform", `translate(${width / 4},${height / 4})`)
        .selectAll(".circle")
        .data(data.nodes)
        .enter()
        .append("g")
        .on("mouseover", function (d, data) {
            div.innerHTML += `Number of publications: ${data["publications"].length}`;
            node_elements.classed("inactive", true);
        })
        .on("mouseout", function (d) {
            div.innerHTML = ''
            d3.selectAll(".inactive").classed("inactive", false);
        })

    node_elements.append("circle")
        .attr("r", (d, i) => {
            return scale_radius(node_degree[d["id"]] * 2);
        })
        .attr("fill", (d) => {
            return color(d.publications[0]["First_author_Country"]);
        });

    svg.call(d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([1, 8])
        .on("zoom", zoomed));

    let forceSim = d3.forceSimulation(data.nodes)
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .force("center", d3.forceCenter(800, 900))
        .force("collide",
            d3.forceCollide().radius((d, i) => {
                return scale_radius(d["publications"].length*5);
            }))
        .force("charge", d3.forceManyBody())
        .force("link",d3
            .forceLink(data.links)
            .id((d) => d.id)
            .distance(80)
            .strength(1)
        )
        .on("tick", ticked);

    // Bonus part code
    const linkStrengthSlider = document.getElementById("linkStrength");
    const collideSlider = document.getElementById("collide");
    const chargeSlider = document.getElementById("charge");

    const publicationRadio = document.getElementById("publicationRadio");
    const degreeRadio = document.getElementById("degreeRadio");
    const citationRadio = document.getElementById("citationRadio");

    let linkStrengthOutput;
    let collideOutput;
    let chargeOutput;

    linkStrengthSlider.oninput = function() {
        linkStrengthOutput = parseFloat(this.value);
        console.log(`linkStrengthOutput: ${linkStrengthOutput}`)

        forceSim.force("link",d3
            .forceLink(data.links)
            .id((d) => d.id)
            .distance(80)
            .strength(linkStrengthOutput)
        );
        forceSim.nodes(data.nodes);
        forceSim.alpha(1).restart();
    }
    collideSlider.oninput = function() {
        collideOutput = parseFloat(this.value);
        console.log(`collideOutput: ${collideOutput}`);

        forceSim.force("collide").strength(collideOutput);
        forceSim.nodes(data.nodes);
        forceSim.alpha(1).restart();
    }
    chargeSlider.oninput = function() {
        chargeOutput = parseFloat(this.value)
        console.log(`chargeOutput: ${chargeOutput}`)

        forceSim.force("charge", d3.forceManyBody().strength(chargeOutput));
        forceSim.nodes(data.nodes);
        forceSim.alpha(1).restart();
    }

    publicationRadio.oninput = function() {
        changeNodeSize(this.value);
    }
    degreeRadio.oninput = function() {
        changeNodeSize(this.value);
    }
    citationRadio.oninput = function() {
        changeNodeSize(this.value);
    }

    function changeNodeSize(size) {
        node_elements.select('circle')
            .attr('r', (d, i) => {
                switch(size) {
                    case 'publications':
                        console.log(size)
                        return scale_radius(d["publications"].length)
                    case 'degrees':
                        console.log(size)
                        return scale_radius(node_degree[d["id"]] * 2)
                    case 'citations':
                        console.log(size)
                        return scale_radius(d["publications"].length*3)
                }
            })
            .attr("fill", (d) => {
                return color(d.publications[0]["First_author_Country"]);
            });
    }
});