let timeoutId;
const socket = io();

const isLocal = window.location.href === "localhost" || "127.0.0.1";
const $ = id => document.getElementById(id);
const video = $("myVideo"), videoContainer = $("videoContainer"), controls = $("controls"), videoInfo = $("video-info"), playButton = $("playPause"), fullScreenButton = $("fullScreen"), volumeSlider = $("volumeSlider"), positionSlider = $("positionSlider"), playTime = $("play-time"), resync = $('resync');

const formatTime = seconds => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

window.onload = () => {
    positionSlider.max = video.duration;
    playTime.innerHTML = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
}

window.addEventListener('keypress', (key) => {
    if (key.code === "Space") {
        playButton.click()
    }
})

video.addEventListener('timeupdate', () => {
    positionSlider.value = video.currentTime;
    playTime.innerHTML = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
});

positionSlider.addEventListener('input', () => video.currentTime = positionSlider.value);
volumeSlider.addEventListener("input", () => video.volume = volumeSlider.value);

fullScreenButton.addEventListener("click", async () => {
    if (document.fullscreenElement === null) {
        await videoContainer.requestFullscreen()
    } else {
        await document.exitFullscreen()
    }
});

document.addEventListener('mouseout', () => {
    controls.style.display = 'none';
    videoInfo.style.display = 'none';
    document.body.style.cursor = 'none';
});

document.addEventListener('mousemove', () => {
    controls.style.display = 'flex';
    videoInfo.style.display = 'block';
    document.body.style.cursor = 'auto';
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
        controls.style.display = 'none';
        videoInfo.style.display = 'none';
        document.body.style.cursor = 'none';
    }, 3000);
});

// Socket stuff
let myID;
socket.on('connect', function () {
    myID = socket.id
})

playButton.onclick = () => {
    video.paused ? socket.emit('play') : socket.emit('pause');
    playButton.innerHTML = video.paused ? "Play" : "Pause";
}

socket.on('pause', function () {
    if (!video.paused) {
        video.pause();
        playButton.innerHTML = video.paused ? "Play" : "Pause";
    }
});

socket.on('play', function () {
    if (video.paused) {
        video.play();
        playButton.innerHTML = video.paused ? "Play" : "Pause";
    }
});

let isSocketSeek = false;
video.onseeked = () => {
    !isSocketSeek ? socket.emit('seek', video.currentTime) : isSocketSeek = false
};
socket.on('seek', function (time) {
    video.pause();
    isSocketSeek = true;
    video.currentTime = time;
    playButton.innerHTML = video.paused ? "Play" : "Pause";
});

resync.onclick = () => {
    socket.emit('requestResync');
};

socket.on('resync', function () {
    socket.emit('sendCurrentTime', video.currentTime, myID);
});

socket.on('setCurrentTime', function (time) {
    video.currentTime = time;
    positionSlider.value = time;
    playTime.innerHTML = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
});