const { connectMq, getChannel } = require("../backend/rabbitMqClient");
const {
  fetchUnseenMessage,
  markMessageAsSent,
  markMessageAsFailed,
} = require("./dao/outboxDao");

const QUEUE_NAME = "transaction_requests";

const pollAndPublish = async () => {
  let message = null;
  let channel = null;

  try {
    channel = getChannel();
    if (!channel) {
      console.log("Channel not available. Retrying...");
      return;
    }

    await channel.assertQueue(QUEUE_NAME, { durable: true });

    message = await fetchUnseenMessage();
    if (!message) {
      return;
    }

    console.log(`Processing message with ID: ${message.id}`);

    const published = channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(JSON.stringify(message.payload)),
      {
        persistent: true,
      },
    );

    if (published) {
      await markMessageAsSent(message.id);
      console.log(
        `Message ${message.id} sent successfully and marked as SENT.`,
      );
    } else {
      await markMessageAsFailed(message.id);
      console.error(
        `Failed to publish message ${message.id}. RabbitMQ buffer full.`,
      );
    }
  } catch (err) {
    console.error("Error in pollAndPublish:", err);
    if (message) {
      await markMessageAsFailed(message.id);
    }
  }
};

const startRelay = async () => {
  await connectMq();

  const pollingInterval = 1000;
  setInterval(pollAndPublish, pollingInterval);
};

startRelay();
