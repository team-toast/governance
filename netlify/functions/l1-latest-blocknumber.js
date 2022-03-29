exports.handler = async () => {
    const Web3 = require("web3");
    //console.log(process.env.RIVET_URL);
    const web3 = new Web3(
        new Web3.providers.HttpProvider(process.env.RIVET_URL)
    );
    const blockNumber = await web3.eth.getBlockNumber();
    console.log("blockNumber: ", blockNumber);
    return {
        statusCode: 200,
        body: blockNumber.toString(),
    };
};
