const uriStreamer = "wss://the.testingwebrtc.com:3000";
const uriSubscriber = "wss://the.testingwebrtc.com:3001";
const uriAnalytics = "wss://the.testingwebrtc.com:3002";
let username = "";
let user_info = "";
let streamerWebsocket : WebSocket;
let subscriberWebsocket : WebSocket;
let analyzerWebsocket : WebSocket;


const streamerPeerConnections = {};
let subscriberPeerConnection : RTCPeerConnection;
const RTCConfig = {
    iceServers: [
        {
            // "urls": "turn:test.testingwebrtc.com:443",
            // 'username': 'test',
            // 'credential': 'key1234567890',
            "urls": "stun:stun.l.google.com:19302",
        }
    ]
};
//Stream constraints
let constraints = {
    video: { facingMode: "user", width: {exact: 640}, height: {exact: 480} },
    mimeType: 'video/VP8'
    // audio: true
};


// Analyzer
let maxK = 0;
let minT = 16976116344130;
let maxT = 0;
let timestampClis = {};


document.getElementById("startStreamerBtn").onclick = startStreamer;
document.getElementById("connectSubscriberBtn").onclick = connectSubscriber;
document.getElementById("startDummyClientsBtn").onclick = startDummyClients;
const streamerVideo = document.getElementById("streamer") as HTMLVideoElement;
const subscriberVideo = document.getElementById("subscriber") as HTMLVideoElement;
const numberOfDummyClientsSlider = document.getElementById("numOfDummyClients") as HTMLInputElement;
const numberOfDummyClientsTxt = document.getElementById("numDummyClientsTxt") as HTMLParagraphElement;
const currentNumDummyClientsTxt = document.getElementById("currentNumDummyClientsTxt") as HTMLParagraphElement;
numberOfDummyClientsTxt.innerHTML = "Number of dummy clients: " + numberOfDummyClientsSlider.value;


const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const charactersLength = characters.length;

function makeID(length = 16) {
    let result = '';
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    };
    return result;
};



//UI
function startStreamer() {
    (document.getElementById("resolution") as HTMLSelectElement).disabled = true;
    (document.getElementById("startStreamerBtn") as HTMLButtonElement).disabled = true;
    (document.getElementById("connectSubscriberBtn") as HTMLButtonElement).disabled = false;
    (document.getElementById("startDummyClientsBtn") as HTMLButtonElement).disabled = false;
    if (screen.width > 600) {
        if ((document.getElementById("resolution") as HTMLSelectElement).value == "1920x1080") {
            constraints.video.width = {exact: 1920}
            constraints.video.height = {exact: 1080}
        } else if ((document.getElementById("resolution") as HTMLSelectElement).value == "1280x720") {
            constraints.video.width = {exact: 1280}
            constraints.video.height = {exact: 720}
        };
    } else {
        if ((document.getElementById("resolution") as HTMLSelectElement).value == "1920x1080") {
            constraints.video.width = {exact: 1080}
            constraints.video.height = {exact: 1920}
        } else if ((document.getElementById("resolution") as HTMLSelectElement).value == "1280x720") {
            constraints.video.width = {exact: 720}
            constraints.video.height = {exact: 1280}
        } else {
            constraints.video.width = {exact: 480}
            constraints.video.height = {exact: 640}
        };
    };
    //Set username
    username = makeID()
    //Start websocket
    streamerWebsocket = new WebSocket(uriStreamer);
    //Setup streaming
    navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
        streamerVideo.srcObject = stream;
    })
    .catch(error => console.error(error));


    //Streamer
    streamerWebsocket.onopen = () => {
        streamerWebsocket.send("U\n" + username + "\n" + user_info);
    };

    streamerWebsocket.onclose = () => {
    };

    streamerWebsocket.onmessage = e => {
        let parts = e.data.split("\n", 5);
        if (parts[0] == "R") {
            newSubscriber(parts[1]);
        } else if (parts[0] == "A") {
            processAnswer(parts[1], JSON.parse(parts[2]));
        } else if (parts[0] == "C") {
            processCandidateStreamer(parts[1], JSON.parse(parts[2]));
        };
    };

    function newSubscriber(id) {
        const peerConnection = new RTCPeerConnection(RTCConfig);
        streamerPeerConnections[id] = peerConnection;

        //Set streaming
        let stream = streamerVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        //Candidate
        peerConnection.onicecandidate = e => {
            if (e.candidate) {
                streamerWebsocket.send("C\n" + id + "\n" + JSON.stringify(e.candidate));
            };
        };

        //Create and send offer
        peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
            streamerWebsocket.send("O\n" + id + "\n" + JSON.stringify(peerConnection.localDescription));
        });

        peerConnection.onconnectionstatechange = () => {
            console.log("Disconnecting peer");
            if (peerConnection.iceConnectionState == 'disconnected') {
                streamerPeerConnections[id].close();
                delete streamerPeerConnections[id];
            };
        };
    };

    function processAnswer(id, answer) {
        if (id in streamerPeerConnections) {
            streamerPeerConnections[id].setRemoteDescription(answer);
        };
    };

    function processCandidateStreamer(id, candidate) {
        streamerPeerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
    };
};

function connectSubscriber() {
    (document.getElementById("connectSubscriberBtn") as HTMLButtonElement).disabled = true;
    subscriberWebsocket = new WebSocket(uriSubscriber);


    //Subscriber
    subscriberWebsocket.onopen = () => {
        subscriberWebsocket.send("R\n" + username);
    };

    subscriberWebsocket.onclose = () => {
    };

    subscriberWebsocket.onmessage = e => {
        let parts = e.data.split("\n", 5);
        if (parts[0] == "O") {
            processOffer(parts[1], JSON.parse(parts[2]));
        } else if (parts[0] == "C") {
            processCandidateSubscriber(parts[1], JSON.parse(parts[2]));
        };
    };

    function processOffer(id, offer) {
        subscriberPeerConnection = new RTCPeerConnection(RTCConfig);
        subscriberPeerConnection
        .setRemoteDescription(offer)
        .then(() => subscriberPeerConnection.createAnswer())
        .then(sdp => subscriberPeerConnection.setLocalDescription(sdp))
        .then(() => {
            subscriberWebsocket.send("A\n" + id + "\n" + JSON.stringify(subscriberPeerConnection.localDescription));
        });

        //Stream
        subscriberPeerConnection.ontrack = e => {
            subscriberVideo.srcObject = e.streams[0];
        };

        //Candidate
        subscriberPeerConnection.onicecandidate = e => {
            if (e.candidate) {
                subscriberWebsocket.send("C\n" + id + "\n" + JSON.stringify(e.candidate));
            };
        };
    }


    function processCandidateSubscriber(_, candidate) {
        subscriberPeerConnection
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch(e => console.error(e));
    };
};


function startDummyClients() {
    (document.getElementById("startDummyClientsBtn") as HTMLButtonElement).disabled = true;
    numberOfDummyClientsSlider.disabled = true;
    //Start websocket
    analyzerWebsocket = new WebSocket(uriAnalytics);
    
    //Streamer
    analyzerWebsocket.onopen = () => {
        analyzerWebsocket.send("R\n" + username + "\n" + numberOfDummyClientsSlider.value);
    };

    analyzerWebsocket.onclose = () => {
    };

    analyzerWebsocket.onmessage = e => {
        let parts = e.data.split("\n");
        if (parts.length != 2) {
            console.error("Analyzer error");
        };
        if (parts[0] == "N") {
            let minP = 16976116344130;
            let maxP = 0;
            let avg = 0;
            for (let i = 0; i < maxK && i < parseInt(numberOfDummyClientsSlider.value); i++) {
                let sumOfC = timestampClis[i];
                let pacPerS = 1000 * sumOfC / (maxT - minT);
                avg += pacPerS;
                if (pacPerS < minP) { minP = pacPerS };
                if (pacPerS > maxP) { maxP = pacPerS };
            };
            if (avg != 0) { avg = avg / maxK };
            maxK += 1;
            chartAddData(maxP, avg, minP);
            minT = 16976116344130;
            maxT = 0;
            timestampClis = {};
        } else {
            let cliI = parseInt(parts[0]);
            let newT = parseInt(parts[1]);
            if (newT < minT) { minT = newT };
            if (newT > maxT) { maxT = newT };
            if (cliI in timestampClis) {
                timestampClis[cliI] += 1
            } else {
                timestampClis[cliI] = 1
            };
        };
    };    
};


numberOfDummyClientsSlider.oninput = () => {
    numberOfDummyClientsTxt.innerHTML = "Number of dummy clients: " + numberOfDummyClientsSlider.value;
};


//Chart
let packetChart = (document.getElementById("packetChart") as HTMLCanvasElement).getContext("2d");

const xValues = [...Array(121).keys()];
let chart = new Chart(packetChart, {
    type: "line",
    data: {
        labels: xValues,
        datasets: [{
            label: "Maximum",
            data: [],
            borderColor: "green",
            fill: false
        },{
            label: "Average",
            data: [1600,1700,1700,1900,2000,2700,4000,5000,6000,7000],
            borderColor: "blue",
            fill: false
        },{
            label: "Minimum",
            data: [300,700,2000,5000,6000,4000,2000,1000,200,100],
            borderColor: "red",
            fill: false
        }]
    },
});

function chartAddData(mx: number, avg: number, mi: number) {
    chart.data.datasets[0].data.push(mx);
    chart.data.datasets[1].data.push(avg);
    chart.data.datasets[2].data.push(mi);
    chart.update();
    document.getElementById("dummyClientProgressBar").style.width = maxK/parseInt(numberOfDummyClientsSlider.value) + "%";
};


//Unload
window.onunload = window.onbeforeunload = () => {
    subscriberPeerConnection.close();
    streamerWebsocket.close();
    subscriberWebsocket.close();
    analyzerWebsocket.close();
};