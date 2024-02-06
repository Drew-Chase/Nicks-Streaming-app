const container = $("#container");
const video = $('video')
const popup = $("#search-popup")
const searchInput = $("input#search")
let searchTimer = null;
let clickTimer = null;
let moveTimer = null;
searchInput.on("keyup", async () => {
    if (searchTimer) {
        clearTimeout(searchTimer)
    }
    searchTimer = setTimeout(async () => {
        await search(searchInput.val())
    }, 500)
})

const openSearchPopup = () => {
    searchInput.val('')
    popup.toggleClass('open')
}

async function search(query) {

    const searchResults = $("#search-items")
    if (query === "") {
        searchResults.empty()
        popup.attr('active', null);
        return
    }
    popup.attr('active', "");

    const res = await fetch(`/api/movies?q=${encodeURIComponent(query)}`)
    const data = await res.json();
    searchResults.empty()
    if (data.length === 0) {
        searchResults.append(`<div class="movie">No movies found</div>`)
    }
    data.forEach(movie => {
        const movieElement = $(`<div class="movie" onclick="startMovie('${movie}')">${movie}</div>`)
        searchResults.append(movieElement)
    })
}

function startMovie(movie) {
    video.attr('src', `/Movies/${movie}`);
    play();
    popup.removeClass('open')
}


function play() {
    // socket.emit('play');
    video[0].play()
    $("#play-button i").removeClass('fa-play').addClass('fa-pause');
}

function pause() {
    // socket.emit('pause');
    video[0].pause()
    container.removeClass('playing')
    $("#play-button i").removeClass('fa-pause').addClass('fa-play');
}

function seek(time) {
    // socket.emit('seek', time);
    video[0].currentTime = time;
}

function requestResync() {
    // socket.emit('requestResync');
}

function sendCurrentTime() {
    // socket.emit('sendCurrentTime', video[0].currentTime, socket.id);
}

async function toggleFullscreen() {
    if (!container.hasClass('fullscreen') && document.fullscreenElement === null) {
        container.addClass('fullscreen')
        await container[0].requestFullscreen()
    } else {
        container.removeClass('fullscreen')
        await document.exitFullscreen()
    }
}

video.on('timeupdate', () => {
    $("#current-time").text(formatTime(video[0].currentTime))
    $("#duration").text(formatTime(video[0].duration))
    sendCurrentTime()
})
video.on('dblclick', async () => {
    if (clickTimer) {
        clearTimeout(clickTimer)
    }
    await toggleFullscreen()
});
video.on('click', () => {
    if (clickTimer) {
        clearTimeout(clickTimer)
    }
    clickTimer = setTimeout(() => {
        video[0].paused ? play() : pause()
    }, 200)
});

$("#play-button").on('click', () => {
    video[0].paused ? play() : pause()
})

$("#fullscreen-button").on('click', async () => {
    await toggleFullscreen()
});

$(document).on("mousemove", () => {
    container.removeClass('playing')
    clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
        if (video[0].paused) return;
        container.addClass('playing')
    }, 3000)
});

$(document).on("mouseout", () => {
    if (video[0].paused) return;
    container.addClass('playing')
});


const formatTime = seconds => {
    const hrs = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}:${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};


$(document).on('keyup', e => {
    switch (e.code) {
        case "k":
        case "Space":
            video[0].paused ? play() : pause()
            break;
    }
})

video.attr("src", "/Movies/Artifact Gameplay Demo.mp4");