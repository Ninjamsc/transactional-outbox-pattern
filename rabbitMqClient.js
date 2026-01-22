const amqp = require("amqplib");
const dotenv = require("dotenv");
dotenv.config();

let connection = null;
let channel = null;

const connectMq = async () => {
    try{
        if (connection && !connection.isClosed()){
            return;
        }

        console.log("Connecting to RabbitMq....");

        connection = await amqp.connect(process.env.RABBITMQ_URI);
        console.log("Successfully connected to RabbitMq");

        connection.on('error', (err) => {
            console.error("RabbitMq connection error: ", err);

            if (err.message.includes('ECONNREFUSED')){
                console.error('Connection refused. Is RabbitMQ running?');
                setTimeout(connectMq, 5000);
            }
        });

        connection.on('close', () => {
            console.warn('RabbitMQ connection closed. Attempting to reconnect...');
            connection = null;
            setTimeout(connectMq, 5000);
        });

        channel = await connection.createChannel();
        console.log('RabbitMq channel created');
    } catch (error){
        console.error('Failed to connect to RabbitMq: ', error);
        setTimeout(connectMq, 5000);
    }
};

const getChannel = () => channel;

module.exports = {
    connectMq: connectMq,
    getChannel: getChannel,
};