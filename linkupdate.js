const glob = require('glob');
const path = require('path');
const fs = require('fs');
const jsdom = require("jsdom");
const util = require("util");
const {JSDOM} = jsdom;

const create_link = (name, domain, lab) => {
    const visible_text = '<h3 class="text-h3-darkblue" style="margin-top: 2px;"> %s </h3>';
    const a = '<a href="%s.html?domain=%s&lab=%s" class="sidebar-a"> %s </a>';
    return util.format(a, name, domain, lab, util.format(visible_text, name));
}

function updateHtmlandLog(path, content, log) {      
    if (content){
        fs.writeFileSync(path, content);
        log.success.push(path);
    }
    else{
        log.fail.push(path);
    }
    console.log("Success: ", log.success.length, "Fail: ", log.fail.length);
}


const Sidebar = (dom) => dom.window.document.querySelector(".sidebar-col-2");


function replaceSidebarContents(dom, linknames, domain, lab) {
    const sidebar = Sidebar(dom);
    if (sidebar === null) return null;
    sidebar.innerHTML = "";
    linknames
	  .map(n => create_link(n, domain, lab))
	  .map(JSDOM.fragment)
	  .forEach(f => sidebar.appendChild(f));
    return dom.serialize();
}

function applyPatch(html_path, linknames, domain, lab){
    console.log(html_path);
    const htmlsrc = fs.readFileSync(html_path, encoding="utf-8");	
    const dom = new JSDOM(htmlsrc);
    const newhtml = replaceSidebarContents(dom, linknames, domain, lab);
    updateHtmlandLog(html_path, newhtml, log);
    fs.writeFileSync("report.json", JSON.stringify(log));
}

let log = 
    { success : []
    , fail : []
    };

const config_file = "config.json";
const config = JSON.parse(fs.readFileSync(config_file, encoding="utf-8"));

let pat = path.join(config.lab_root, 'src/lab/exp*/*.html');
glob(pat, (err, html_paths) => html_paths.forEach(p => applyPatch(p, config.linknames
								  , config.domain, config.lab)));
