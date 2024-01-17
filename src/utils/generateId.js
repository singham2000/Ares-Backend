exports.generateClientId = () => {
    let clientId = "";
    const possible = "0123456789";

    for (let i = 0; i < 6; i++) {
        clientId += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return clientId;
};