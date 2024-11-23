var statusC = 200;

async function GetData(url = '') {
    const response = await fetch(url);
    if(response.status === 200) {
        return response.json();
    }
    else {
        statusC = response.status;
        return response.text();
    }
}

function SetLinks(releasenote) {
    if(statusC === 200) {
        document.querySelector(".versioncont span").innerHTML = "Versiyon: " + releasenote.version;
        document.querySelector(".contentcont").innerHTML = releasenote.content;
    }
    else {
        document.querySelector("main").style.display = "none";
        document.querySelector(".pagenotfound").innerHTML = releasenote;
    }
}

window.onload = () => {
    GetData('/api' + window.location.pathname).then((data) => {
        console.log(data);
        SetLinks(data);
    })
};