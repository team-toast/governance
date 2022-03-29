exports.handler = async (event) => {
    const Web3 = require("web3");
    //console.log("environment var: ", process.env.INFURA_URL);
    const web3Mainnet = new Web3(
        new Web3.providers.HttpProvider(process.env.RIVET_URL)
    );

    const { blocknumber } = event.queryStringParameters;
    //console.log("Server Function BlockNumber: ", blocknumber);
    const blockInfo = await web3Mainnet.eth.getBlock(blocknumber);
    //console.log(blockInfo["timestamp"].toString());
    return {
        statusCode: 200,
        body: blockInfo["timestamp"].toString(),
    };
};
