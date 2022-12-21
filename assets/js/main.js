"use strict";

async function loadData() {
    //load fansub data
    //let url = `./data/fansubList.json?time=${Date.now()}`;
    let url = `https://raw.githubusercontent.com/nekonyan14986/ifs_italian_fansub_search/master/data/fansubList.json?time=${Date.now()}`;
    //let url = `./data/fansubList_small.json?time=${Date.now()}`;
    await fetch(url)
        .then(response => response.json())
        .then(data => {
            window.fansubData = data;
        })
        .catch(error => console.log(error));
}

async function loadIcons() {
    //load fansub data
    //let url = `./data/types.json?time=${Date.now()}`;
    let url = `https://raw.githubusercontent.com/nekonyan14986/ifs_italian_fansub_search/master/data/types.json?time=${Date.now()}`;
    await fetch(url)
        .then(response => response.json())
        .then(data => {
            window.icons_mapping = data;
        })
        .catch(error => console.log(error));
}

function create_section(name, table_id) {
    let section = document.createElement('section');
    let title = document.createElement('span')
    let table = document.createElement('table')

    table.classList.add("table", "custom-table", "table-responsive", "custom-table-responsive")
    table.id = table_id
    let t_head = document.createElement('thead')
    let t_body = document.createElement('tbody')

    let first_row_html = `<input type="checkbox" id="${table_id}" checked="false" onclick="sel_head(this)">`


    let table_headers_list = [first_row_html, "Nome", "Sito & Social", "Torrent", "RSS", "Note"]

    let t_title_row = document.createElement('tr')

    table_headers_list.forEach(element => {
        let t_head_el = document.createElement('th')
        t_head_el.scope = "col"
        t_head_el.innerHTML = element

        t_title_row.append(t_head_el)
    });


    t_head.append(t_title_row)

    table.append(t_head)
    table.append(t_body)

    title.innerText = name
    title.className = "mb-5"

    section.className = "section_global";
    section.style = "overflow-x:auto;"

    section.append(title)
    section.append(table)

    document.querySelector("body > div.content > div").append(section);
}

function get_mapped_icon(type, value) {
    let name = icons_mapping[type]["name"]
    let img = icons_mapping[type]["image"]

    return `<a title="${name} - ${value}" href="${value}" target="_blank"><img src="assets/icons/${img}"></a>`
}

function populate_table(table_id, data) {
    let table = document.querySelector(`#${table_id} tbody`);
    data.forEach((fansub, index) => {
        let row = document.createElement('tr')

        let sito_socials = ""
        fansub.socials.forEach(
            src => {
                sito_socials += get_mapped_icon(src.type, src.value);
            }
        )

        let torrent_src = ""
        fansub.torrent_sources.forEach(
            src => {
                torrent_src += get_mapped_icon(src.type, src.value);
            }
        )

        let rss_src = ""
        fansub.rss_sources.forEach(
            src => {
                rss_src += get_mapped_icon(src.type, src.value);
            }
        )

        row.innerHTML = `
		<th scope="row">
			<input type="checkbox" id="${table_id}-${index}" checked="${fansub.selected}" onclick="sel_row(this)" ifs_type="${table_id}" ifs_pos=${index}>
		</th>
		<td>${fansub.name}</td>
		<td>${sito_socials}</td>
		<td>${torrent_src}</td>
		<td>${rss_src}</td>
		<td>${fansub.notes}</td>
		`;

        table.append(row)
    });
}

function check_values(id) {
    fansubData.data[id].groups.forEach(
        src => {
            console.log(src.name, src.selected)
        }
    )
}



function sel_row(cb) {
    fansubData.data[cb.getAttribute("ifs_type")]["groups"][cb.getAttribute("ifs_pos", 10)].selected = cb.checked;
    //check_values(cb.getAttribute("ifs_type"))
}

function sel_head(cb) {
    fansubData.data[cb.id].groups.forEach(
        (source, index) => {
            source.selected = cb.checked;
            document.getElementById(`${cb.id}-${index}`).checked = cb.checked;
        });
    //check_values(cb.id)
}

function create_tables() {
    document.getElementById("info").innerText = fansubData.last_update;

    for (let section_id in fansubData.data) {
        if (fansubData.data.hasOwnProperty(section_id)) { // this will check if key is owned by data object and not by any of it's ancestors
            create_section(fansubData.data[section_id].name, section_id);
            populate_table(section_id, fansubData.data[section_id].groups);
        }
    }
}

async function ifs_main() {
    await loadData()
    await loadIcons()
    create_tables()

}

function normalize_link(link) {
    return link.replace("https://www.", '').replace("http://www.", '').replace("https://", '').replace("http://", '').replace("www.", '');
}

function pre_build(){
    let do_web = document.getElementById("web").checked
    let do_torrent = document.getElementById("torrent").checked
    let destDiv = document.getElementById("divResultsLinks");
    destDiv.innerHTML = "";

    if (!do_web && !do_torrent){
        return;
    }

    let p = document.createElement("p");
    p.innerText = "Creazione links...";
    destDiv.appendChild(p)
    setTimeout(build_search, 300)
}

function build_search() {
    let do_web = document.getElementById("web").checked
    let do_torrent = document.getElementById("torrent").checked
    let search_term = document.getElementById("query_box").value
    let destDiv = document.getElementById("divResultsLinks");
    destDiv.innerHTML = "";

    let website_list = []

    for (let section_id in fansubData.data) {
        if (!fansubData.data.hasOwnProperty(section_id)) // this will check if key is owned by data object and not by any of it's ancestors
            continue;

        fansubData.data[section_id].groups.forEach(fansub => {
            if (fansub.selected) {
                if (do_web && fansub.socials.length != 0) {
                    fansub.socials.forEach(t_link => {
                        if (t_link.type == "web")
                            website_list.push(normalize_link(t_link.value));
                    });
                }
                if (do_torrent && fansub.torrent_sources.length != 0) {
                    fansub.torrent_sources.forEach(t_link => {
                        website_list.push(normalize_link(t_link.value));
                    });
                }
            }
        });
    }

    //console.log(website_list)

    // chunk size must be dynamic -> (32 - number of search words)
    let wordcount = search_term.trim().split(/\s+/).length
    let chunkSize = 32 - wordcount;
    let chunk_num = 1;
    for (let i = 0; i < website_list.length; i += chunkSize) {
        const chunk = website_list.slice(i, i + chunkSize);
        let urls_str = chunk.join(" OR site:")

        let anchor = document.createElement('a');
        anchor.href = `https://www.google.com/search?q=intitle:${search_term} site:${urls_str}`;
        anchor.target = "_blank";
        anchor.innerText = `${search_term.substr(0,5)}... ${chunk_num}`;

        let sep = document.createElement("p");
        sep.innerText = " | ";

        destDiv.appendChild(anchor)
        if (i + chunkSize < website_list.length)
            destDiv.appendChild(sep);

        chunk_num++;
    }

    destDiv.hidden = false;

}