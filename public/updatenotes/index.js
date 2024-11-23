async function GetData(url = '') {
    const response = await fetch(url);
    return response.json();
}

function SetLinks(notetitles) {
    for (let notetitlei = 0; notetitlei < notetitles.length; notetitlei++) {
        const notetitle = notetitles[notetitlei];
        var titletmp = "/updatenotes/" + notetitle.title;
        if(notetitlei === 0) {
            document.querySelector(".notelinks ul").innerHTML += "<li class='latestupdate'><a class='link" + notetitlei + "' href='" + titletmp + "'>" + notetitle.version + "<div>" + notetitle.content + "</div></a></li>";
        }
        else {
            document.querySelector(".notelinks ul").innerHTML += "<li class='sec'><a class='link" + notetitlei + "' href='" + titletmp + "'>" + notetitle.version + "</a></li>";
        }
    }
}

window.onload = () => {
    GetData('/api/updatenotes').then((data) => {
        SetLinks(data);
    })
};