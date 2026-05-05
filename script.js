const nonstandardTZs = [
    ["Alaska Daylight Time", "AKDT"],
    ["Alaska Standard Time", "AKST"],
    ["Chamorro Standard Time", "ChST"],
    ["Moscow Standard Time", "MSK"],
    ["Pakistan Standard Time", "PKT"],
    ["Coordinated Universal Time", "UTC"],
    ["Western Indonesia Time", "WIB"],
    ["Eastern Indonesia Time", "WIT"],
    ["Central Indonesia Time", "WITA"]
];
const defaultTZs = [
    "etc/UTC",
    "Europe/London",
    "Europe/Prague",
    "Europe/Kyiv",
    "Indian/Maldives",
    "Asia/Jakarta",
    "Asia/Shanghai",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Pacific/Auckland",
    "Pacific/Honolulu",
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Chicago",
    "America/New_York",
    "America/Sao_Paulo",
    "Atlantic/Cape_Verde",
];
const testTZs = [
    "Africa/Casablanca",
    "Africa/Johannesburg",
    "Asia/Amman",
    "Asia/Tehran",
    "Europe/Astrakhan",
    "Asia/Kabul",
    "Asia/Almaty",
    "Asia/Kolkata",
    "Asia/Kathmandu",
    "Asia/Bishkek",
    "Asia/Yangon",
    "Asia/Bangkok",
    "Asia/Hong_Kong",
    "Australia/Eucla",
    "Asia/Chita",
    "Australia/Darwin",
    "Australia/Brisbane",
    "Australia/Lord_Howe",
    "Pacific/Bougainville",
    "Asia/Anadyr",
    "Pacific/Chatham",
    "Pacific/Niue",
    "Pacific/Honolulu",
    "Pacific/Gambier",
    "Pacific/Pitcairn",
    "America/Los_Angeles",
    "America/Belize",
    "America/Bogota",
    "America/Barbados",
    "America/Araguaina",
    "America/Noronha",
    "Atlantic/Cape_Verde"
];
let clockTZs = [];
var localTZ;
var twelveHour = false;
var editing = false;

function isRealTZ(TZName) {
    if (!TZName.includes("/")) {
        return false;
    }
    try {
        const testFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: TZName,
        });
        return true;
    } catch (error) {
        return false;
    }
}

function setLocalTZ() {
    const now = new Date();
    // getTimezoneOffset is inverted
    let localOffsetHours = now.getTimezoneOffset() / -60;
    let localOffsetFrac = localOffsetHours % 1;
    localOffsetHours -= localOffsetFrac;
    if (localOffsetHours >= 0) {
        localOffsetHours = "+" + localOffsetHours;
    }
    if (localOffsetFrac != 0) {
        localOffsetHours += ":" + Math.abs(localOffsetFrac) * 60;
    }
    localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localAbbreviation = TZtoAbbr(localTZ);
    document.getElementById("localOffsetLabel").innerText = localAbbreviation + " • UTC" + localOffsetHours + "";
    // get Intl TZ and clean up formatting
    const localTZPretty = localTZ.replaceAll("_", " ");
    document.getElementById("localTZLabel").innerText = localTZPretty;
}

function TZtoOffset(TZName) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TZName,
        timeZoneName: 'longOffset' // format as GMT+hhmm or GMT-hhmm
    });
    const formattedOffset = formatter.formatToParts().find(part => part.type === 'timeZoneName').value;
    if (formattedOffset == "GMT") {
        return 0;
    }
    let offsetMultiplier = 1;
    if (formattedOffset.includes("-")) {
        offsetMultiplier = -1;
    }
    const cleanedOffset = formattedOffset.replace(/\D/g,'');
    const offsetInSeconds = offsetMultiplier * parseInt(cleanedOffset.substring(0, 2)) * 3600 + parseInt(cleanedOffset.substring(2)) * 60;
    return offsetInSeconds;
}

function TZtoAbbr(TZName) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TZName,
        timeZoneName: 'long'
    });
    const formattedOffset = formatter.formatToParts().find(part => part.type === 'timeZoneName').value;
    // first check database for nonstandard abbreviations
    for (let i = 0; i < nonstandardTZs.length; i++) {
        if (formattedOffset == nonstandardTZs[i][0]) {
            return nonstandardTZs[i][1];
        }
    }
    // reject timezones without abbreviations
    if (formattedOffset.includes("GMT+") || formattedOffset.includes("GMT-")) {
        return "***";
    }
    // turn long name into abbreviation
    let splitName = formattedOffset.split(" ");
    let abbr = "";
    for (let i = 0; i < splitName.length; i++) {
        abbr += splitName[i].charAt(0);
    }
    return abbr;
}

// precondition: TZName is a real timezone.
function TZtoCity(TZName) {
    return TZName.split("/")[1].replaceAll("_", " ");
}

function storeTZs() {
    localStorage.setItem("storedClockTZs", JSON.stringify(clockTZs));
    notify("success", "List saved to memory.")
}

function retrieveTZs() {
    clearAllClocks();
    const store = JSON.parse(localStorage.getItem("storedClockTZs"));
    if (store != null) {
        addClocks(store);
        notify("success", "Loaded from memory.")
    } else {
        //add default clocks
        addClocks(defaultTZs);
    }
}

function clearTZs() {
    localStorage.removeItem("storedClockTZs");
    notify("danger", "Memory cleared.")
}

function addClocks(TZNames) {
    TZNames.forEach(TZName => {
        addClock(TZName);
    });
}

function addClock(TZName) {
    if (!isRealTZ(TZName)) {
        notify("warning", "\"" + TZName + "\" is not an IANA-reconized timezone identifier.")
        return;
    }
    document.getElementById("tzInput").value = "";
    clockTZs.push(TZName);
    // storeTZs();
    const newClock = document.createElement("tr");
    newClock.classList.add("clock");
    let clockLocalOffsetHours = (TZtoOffset(TZName) - TZtoOffset(localTZ)) / 3600;
    let clockLocalOffsetFrac = clockLocalOffsetHours % 1;
    clockLocalOffsetHours -= clockLocalOffsetFrac;
    if (clockLocalOffsetHours >= 0) {
        clockLocalOffsetHours = "+" + clockLocalOffsetHours;
    }
    if (clockLocalOffsetFrac != 0) {
        clockLocalOffsetHours += ":" + Math.abs(clockLocalOffsetFrac) * 60;
    }
    let constructContent = '<td class="listEnd"></td><td class="clockEdit"><img onclick="moveClock(-1, ' + (clockTZs.length - 1) + ');" class="icon action" src="/icons/arr-u.png"> <img onclick="moveClock(1, ' + (clockTZs.length - 1) + ');" class="icon action" src="/icons/arr-d.png"> <img onclick="removeClock(' + (clockTZs.length - 1) + ');" class="icon action" src="/icons/trash.png"></td><td class="clockCity">' + TZtoCity(TZName) + '</td><td class="clockOffset"><small>' + clockLocalOffsetHours + '</small></td><td class="clockTime displayTime">00:00</td><td class="clockAbbr"><small>' + TZtoAbbr(TZName) + '</small></td><td class="clockHourContainer"><table class="clockHours"><tr>';
    for (let i = 0; i < 36; i++) {
        constructContent += '<td class="clockHour displayTime">' + modToHours(i, twelveHour) + '</td>';
    }
    constructContent += '</tr></table></td>';
    newClock.innerHTML = constructContent;
    document.getElementById("clockContainer").appendChild(newClock);
    updateClocks();
}

function modToHours(number, twelve) {
    if (twelve) {
        if (number % 24 <= 11) {
            return (number - 1) % 12 + 1 + "<small>A</small>";
        } else {
            return (number - 1) % 12 + 1 + "<small>P</small>";
        }
    } else {
        return number % 24;
    }
}

function removeClock(index) {
    const clockToRemove = document.querySelector(".clock:nth-child(" + (index + 1) + ")");
    const clocks = document.querySelectorAll(".clock");
    clockToRemove.style.filter = "opacity(0) blur(10px)";
    for (let i = index + 1; i < clocks.length; i++) {
        clocks[i].style.translate = "0 -100%";        
    }
    setTimeout(() => {
        clockToRemove.remove();
        if (clockTZs.length != 0) {
            clockTZs.splice(index, 1);
            reloadClocks();
            if (clockTZs.length == 0) {
                terminateEdit();
            } else {
                resumeEdit();
            }
        }
    }, 250);
}

function moveClock(direction, index) {
    const clockToMove = document.querySelector(".clock:nth-child(" + (index + 1) + ")");
    if (direction == -1) {
        if (index == 0) {
            notify("warning", "Can't move first item up.");
            return;
        }
        const clockToSwap = document.querySelector(".clock:nth-child(" + (index) + ")")
        clockToMove.style.translate = "0 -100%";      
        clockToSwap.style.translate = "0 100%";        
    } else if (direction == 1) {
        if (index == clockTZs.length - 1) {
            notify("warning", "Can't move last item down.");
            return;
        }
        const clockToSwap = document.querySelector(".clock:nth-child(" + (index + 2) + ")")
        clockToMove.style.translate = "0 100%";      
        clockToSwap.style.translate = "0 -100%";      
    } else {
        return;
    }
    setTimeout(() => {
        clockTZs[index] = clockTZs.splice(index + direction, 1, clockTZs[index])[0];
        reloadClocks();
        resumeEdit();
    }, 250);
}

function reloadClocks() {
    const tempClockTZs = clockTZs.slice();
    clockTZs.length = 0;
    clearAllClocks();
    addClocks(tempClockTZs);
}

function clearAllClocks() {
    clockTZs.length = 0;
    document.querySelectorAll(".clock").forEach(clock => {
        clock.remove();
    });
}

function removeAllClocks() {
    for (let clock = 0; clock < clockTZs.length; clock++) {
        removeClock(clock);
    }
    clockTZs.length = 0;
    notify("success", "List cleared.");
}


function toggleEdit() {
    if (editing) {
        document.querySelectorAll(".clockEdit").forEach(editor => {
            editor.style.maxWidth = "0px";
            editor.style.minWidth = "0px";
            editor.style.filter = "opacity(0) blur(10px)";
        });
    } else {
        document.querySelectorAll(".clockEdit").forEach(editor => {
            editor.style.maxWidth = "80px";
            editor.style.minWidth = "80px";
            editor.style.filter = "opacity(1) blur(0px)";
        });
    }
    editing = !editing;
}

function resumeEdit() {
    editing = true;
    document.querySelectorAll(".clockEdit").forEach(editor => {
        editor.style.maxWidth = "80px";
        editor.style.minWidth = "80px";
        editor.style.filter = "opacity(1) blur(0px)";
    });
}
function terminateEdit() {
    editing = false;
}

function updateClocks() {
    updateTheme();
    if (editing) {
        resumeEdit();
    }
    const now = new Date();
    const UTC = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    for (let i = 0; i < clockTZs.length; i++) {
        const clockOptions = {
            timeZone: clockTZs[i],
            hour12: twelveHour,
            hour: 'numeric',
            minute: '2-digit'
        }
        formatter = new Intl.DateTimeFormat([], clockOptions);
        const clock = document.querySelectorAll(".clockHours")[i];
        const clockTime = document.querySelectorAll(".clockTime")[i];
        const offset = TZtoOffset(clockTZs[i]);
        clock.style.translate = (66.6667 / 86400 * (UTC + offset - (1 * 3600) + 86400)) % (66.6667) * -1 + "%";
        clockTime.innerHTML = formatter.format(now).replace("AM", "<small>AM</small>").replace("PM", "<small>PM</small>");
    }
}

function updateHours(hours) {
    const actions = document.querySelectorAll(".hours");
    if (hours == 12) {
        localStorage.setItem("hours", "12");
    } else if (hours == 24) {
        localStorage.removeItem("hours");
    }
    const store = localStorage.getItem("hours");
    const localTimeSeconds = document.getElementById("localTimeSec");
    if (store == 12) {
        twelveHour = true;
        actions[0].classList.remove("unselected");
        actions[1].classList.add("unselected");
        localTimeSeconds.classList.add("sspp")
        localTimeSeconds.classList.remove("ss")
    } else {
        twelveHour = false;
        actions[0].classList.add("unselected");
        actions[1].classList.remove("unselected");
        localTimeSeconds.classList.remove("sspp")
        localTimeSeconds.classList.add("ss")
    }
    reloadClocks();
    clockTick();
    if (editing) {
        resumeEdit();
    }
}

function updateTheme(theme) {
    const actions = document.querySelectorAll(".theme");
    if (theme == "light") {
        localStorage.setItem("theme", "light");
    } else if (theme == "dark") {
        localStorage.setItem("theme", "dark");
    } else if (theme == "auto") {
        localStorage.removeItem("theme");
    }
    const store = localStorage.getItem("theme");
    if (store == "light") {
        setTheme("light");
        actions[0].classList.remove("unselected");
        actions[1].classList.add("unselected");
        actions[2].classList.add("unselected");
    } else if (store == "dark") {
        setTheme("dark");
        actions[0].classList.add("unselected");
        actions[1].classList.remove("unselected");
        actions[2].classList.add("unselected");
    } else {
        let hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            setTheme("light");
        } else {
            setTheme("dark");
        }
        actions[0].classList.add("unselected");
        actions[1].classList.add("unselected");
        actions[2].classList.remove("unselected");
    }
}

function setTheme(theme) {
    const root = document.querySelector(":root");
    if (theme == "light") {
        root.style.setProperty('--bg', 'var(--bg-l)');
        root.style.setProperty('--text', 'var(--text-l)');
        root.style.setProperty('--ui', 'var(--ui-l)');
        root.style.setProperty('--grad', 'var(--grad-l)');
        root.style.setProperty('--list-zebra', 'var(--list-zebra-l)');
        root.style.setProperty('--visDivider', 'var(--visDivider-l)');
        root.style.setProperty('--visDay', 'var(--visDay-l)');
        root.style.setProperty('--visNight', 'var(--visNight-l)');
        root.style.setProperty('--displayTime-bg', 'var(--displayTime-bg-l)');
    } else if (theme == "dark") {
        root.style.setProperty('--bg', 'var(--bg-d)');
        root.style.setProperty('--text', 'var(--text-d)');
        root.style.setProperty('--ui', 'var(--ui-d)');
        root.style.setProperty('--grad', 'var(--grad-d)');
        root.style.setProperty('--list-zebra', 'var(--list-zebra-d)');
        root.style.setProperty('--visDivider', 'var(--visDivider-d)');
        root.style.setProperty('--visDay', 'var(--visDay-d)');
        root.style.setProperty('--visNight', 'var(--visNight-d)');
        root.style.setProperty('--displayTime-bg', 'var(--displayTime-bg-d)');
    }
}

function clockTick() {
    const now = new Date();
    const hhmmFormatter = {
        timeZone: localTZ,
        hour12: twelveHour,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }
    formatter = new Intl.DateTimeFormat([], hhmmFormatter);
    let fulltime = formatter.format(now);
    let time = fulltime.substring(0, 5);
    if (twelveHour && time.charAt(0) == "0") {
        time = "&nbsp;&nbsp;&nbsp;" + time.substring(1);
    }
    let timeSec = fulltime.substring(5);
    let milliseconds = now.getMilliseconds();
    if (now.getSeconds() % 5 == 0) {
        updateClocks();
    }
    document.getElementById("localTime").innerHTML = time;
    document.getElementById("localTimeSec").innerHTML = timeSec;
	setTimeout("clockTick()", 1000 - milliseconds % 1000 );
}

function notify(type, message) {
    const newNotification = document.createElement("div");
    newNotification.classList.add("notification");
    newNotification.classList.add(type + "Notification");
    let constructContent = message.replaceAll("<", "&lt;");
    newNotification.innerHTML = constructContent;
    try {
        document.getElementById("notificationContainer").removeChild(document.querySelector(".notification"));
    } catch {}
    document.getElementById("notificationContainer").appendChild(newNotification);
    const notifications = document.querySelectorAll(".notification");
    const currentNotification = notifications[notifications.length - 1];
    currentNotification.style.opacity = 1;
    setTimeout(() => {
        currentNotification.style.opacity = 0;
        currentNotification.style.translate = "0 -100%";
        setTimeout(() => {
            currentNotification.remove();
        }, 500);
    }, 3000);
}