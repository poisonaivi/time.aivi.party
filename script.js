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
let clockTZs = [];
var localTZ;

function isRealTZ(TZName) {
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

function addClock(timeZone) {
    if (!isRealTZ(timeZone)) {
        return;
    }
    document.getElementById("tzInput").value = "";
    clockTZs.push(timeZone);
    const newClock = document.createElement("tr");
    newClock.classList.add("clock");
    let clockLocalOffsetHours = (TZtoOffset(timeZone) - TZtoOffset(localTZ)) / 3600;
    let clockLocalOffsetFrac = clockLocalOffsetHours % 1;
    clockLocalOffsetHours -= clockLocalOffsetFrac;
    if (clockLocalOffsetHours >= 0) {
        clockLocalOffsetHours = "+" + clockLocalOffsetHours;
    }
    if (clockLocalOffsetFrac != 0) {
        clockLocalOffsetHours += ":" + Math.abs(clockLocalOffsetFrac) * 60;
    }
    let constructContent = '<td class="clockCity">' + TZtoCity(timeZone) + '</td><td class="clockOffset"><small>' + clockLocalOffsetHours + '</small></td><td class="clockTime displayTime hhmm">00:00</td><td class="clockAbbr"><small>' + TZtoAbbr(timeZone) + '</small></td><td class="clockHourContainer"><table class="clockHours"><tr>';
    const clockHourVisualWidth = 100 / 36;
    for (let i = 0; i < 36; i++) {
        constructContent += '<td class="clockHour displayTime" style="width: ' + clockHourVisualWidth + '%;">' + i % 24 + '</td>';
    }
    constructContent += '</tr></table></td>';
    newClock.innerHTML = constructContent;
    document.getElementById("clockContainer").appendChild(newClock);
    updateClocks();
}

function updateClocks() {
    updateTheme();
    const now = new Date();
    const UTC = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
    for (let i = 0; i < clockTZs.length; i++) {
        const clockOptions = {
            timeZone: clockTZs[i],
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        }
        formatter = new Intl.DateTimeFormat([], clockOptions);
        const clock = document.querySelectorAll(".clockHours")[i];
        const clockTime = document.querySelectorAll(".clockTime")[i];
        const offset = TZtoOffset(clockTZs[i]);
        clock.style.translate = (66.6667 / 86400 * (UTC + offset - (1 * 3600) + 86400)) % (66.6667) * -1 + "%";
        clockTime.innerHTML = formatter.format(now);
    }
}

function updateTheme() {
    let hour = new Date().getHours();
    const root = document.querySelector(":root");
    // if day
    if (hour >= 6 && hour < 18) {
        root.style.setProperty('--bg', 'var(--bg-l)');
        root.style.setProperty('--text', 'var(--text-l)');
        root.style.setProperty('--ui', 'var(--ui-l)');
        root.style.setProperty('--grad', 'var(--grad-l)');
        root.style.setProperty('--list-zebra', 'var(--list-zebra-l)');
        root.style.setProperty('--visDivider', 'var(--visDivider-l)');
        root.style.setProperty('--visDay', 'var(--visDay-l)');
        root.style.setProperty('--visNight', 'var(--visNight-l)');
    } else {
        root.style.setProperty('--bg', 'var(--bg-d)');
        root.style.setProperty('--text', 'var(--text-d)');
        root.style.setProperty('--ui', 'var(--ui-d)');
        root.style.setProperty('--grad', 'var(--grad-d)');
        root.style.setProperty('--list-zebra', 'var(--list-zebra-d)');
        root.style.setProperty('--visDivider', 'var(--visDivider-d)');
        root.style.setProperty('--visDay', 'var(--visDay-d)');
        root.style.setProperty('--visNight', 'var(--visNight-d)');
    }
}

function clockTick() {
    const now = new Date();
    const hhmmFormatter = {
        timeZone: localTZ,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }
    formatter = new Intl.DateTimeFormat([], hhmmFormatter);
    let fulltime = formatter.format(now);
    let time = fulltime.substring(0, 5);
    let timeSec = fulltime.substring(5);
    let milliseconds = now.getMilliseconds();
    if (now.getSeconds() % 5 == 0) {
        updateClocks();
    }
    document.getElementById("localTime").innerHTML = time;
    document.getElementById("localTimeSec").innerHTML = timeSec;
	setTimeout("clockTick()", 1000 - milliseconds % 1000 );
}