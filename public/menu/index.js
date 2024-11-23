async function GetData(url = '') {
    const response = await fetch(url);
    return response.text();
}

function SetLinks(version) {
    document.querySelector(".versiondiv span").innerHTML = "Versiyon: " + version;
}

window.onload = () => {
    GetData('/api/lastversion').then((data) => {
        SetLinks(data);
    })
};