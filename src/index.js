import getLogger from './utils/logger.js';
import Configuration from './utils/configuration.js';
import SalesforceClient from './utils/salesforceClient';
import Unloader from './devices/unloader';

const EVENT_TRAIN_PAYLOAD_DELIVERED = 'Train_Payload_Delivered';

const logger = getLogger('App');

// Load and check config
if (!Configuration.isValid()) {
    logger.error(
        'Cannot start app: missing mandatory configuration. Check your .env file.'
    );
    process.exit(-1);
}

const unloader = new Unloader();
const sfdc = new SalesforceClient();

// Node process hooks
process.on('warning', e => logger.warn(e.stack));
process.on('unhandledRejection', async (reason, p) => {
    logger.error(`'Unhandled Rejection at: Promise ${JSON.stringify(p)}`);
    if (reason) {
        logger.error('Reason: ', reason);
    }
    await unloader.disconnect();
    process.exit(-1);
});
process.once('SIGINT', async () => {
    logger.info('Gracefully shutting down from SIGINT (Ctrl-C)');
    await unloader.disconnect();
    process.exit(0);
});

async function startApp() {
    logger.info('Starting up');

    // Connect unloader
    await unloader.connect();

    // Connect to Salesforce
    try {
        await sfdc.connect();
    } catch (error) {
        logger.error('Failed to connect to Salesforce org ', error);
        process.exit(-1);
    }

    // Subscribe to robot platform event
    sfdc.subscribeToStreamingEvent('/event/Robot_Event__e', handleRobotEvent);
}

function handleRobotEvent(event) {
    logger.info(`Incoming robot event ${JSON.stringify(event)}`);
    const eventData = event.payload;
    // Process event
    switch (eventData.Event__c) {
        case EVENT_TRAIN_PAYLOAD_DELIVERED:
            onTrainPayloadDelivered(eventData);
            break;
    }
}

async function onTrainPayloadDelivered(eventData) {
    unloader.unload();
}


startApp();
