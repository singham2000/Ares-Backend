exports.timeValidate = (service_type, validateTo, inputTime) => {
    let time = timeForService[service_type];
    const input = new Date(`2024-02-05T${convertTo24HourFormat(inputTime)}`);
    const target = new Date(`2024-02-05T${convertTo24HourFormat(validateTo)}`);
    const timeDifference = Math.abs(input.getTime() - target.getTime());
    const result = timeDifference <= time * 60 * 1000;
    return result;
};

exports.convertTo24HourFormat = (time12Hour) => {
    const [hour, minute, period] = time12Hour.match(/(\d+):(\d+)\s*(AM|PM)/i).slice(1);
    if (!hour || !minute || !period) {
        console.error('Invalid time format');
        return 'Invalid Date';
    }
    let hours = parseInt(hour);
    const minutes = parseInt(minute);
    if (period.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    return formattedTime;
};

exports.sendData = (user, statusCode, res) => {
    const token = user.getJWTToken();

    res.status(statusCode).json({
        "status": "user login successfully",
        "user_data": user,
        token,
    });
};

exports.calculateTimeDifference = (time1, time2, duration) => {
    const [hours1, minutes1] = time1.split(':').map(Number);
    const [hours2, minutes2] = time2.split(':').map(Number);

    const totalMinutes1 = hours1 * 60 + minutes1;
    const totalMinutes2 = hours2 * 60 + minutes2;

    const differenceInMinutes = Math.abs(totalMinutes2 - totalMinutes1);

    const piecesCount = Math.ceil(differenceInMinutes / duration);

    const timeDiffInPieces = [];

    for (let i = 0; i < piecesCount; i++) {
        const currentMinutes = totalMinutes1 + i * duration;
        const hours = Math.floor(currentMinutes / 60) % 24;
        const minutes = currentMinutes % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12; // Convert 0 to 12
        const timeString = `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        timeDiffInPieces.push(timeString);
    }

    return timeDiffInPieces;
}
