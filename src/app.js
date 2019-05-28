require('dotenv').config();
const { PwmDriver, sleep } = require('adafruit-i2c-pwm-driver-async'),
  Winston = require('winston');
import SalesforcePlatform from './salesforce-platform';

// Configure logs
Winston.loggers.add('App', {
  console: { level: 'info', colorize: true, label: 'App' }
});
const LOG = Winston.loggers.get('App');

Winston.default.transports.console.level='debug';
Winston.loggers.get('App').transports.console.level='debug';

const sfdc = new SalesforcePlatform('train');


const driver = new PwmDriver({
  address: 0x40,
  device: '/dev/i2c-1',
  debug: true,
  i2cDebug: false
});

let isShuttingDown = false;
const shutdown = () => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log("\nGracefully shutting down from SIGINT (Ctrl-C) or SIGTERM");
  Promise.all([
    sfdc.disconnect(),
    driver.stop()
  ]).then(process.exit(0))
  .catch(error => {
    LOG.error(error);
    process.exit(-1);
  });
}

// Process hooks
process.on('warning', e => console.warn(e.stack));
process.on('unhandledRejection', (reason, p) => {
    LOG.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);


const EVENT_TRAIN_PAYLOAD_DELIVERED = 'Train_Payload_Delivered';

const onPlatformEvent = platformEvent => {
  // Process event
  const eventData = platformEvent.data.payload;
  switch (eventData.Event__c) {
    case EVENT_TRAIN_PAYLOAD_DELIVERED:
      unload();
    break;
  }
};

const unload = () => {
  driver.setPWM(0, 0, 150)
    .then(() => driver.setPWM(1, 0, 180))
    .then(() => sleep(1))
    .then(() => driver.setPWM(1, 0, 500))
    .then(() => sleep(0.5))
    .then(() => driver.setPWM(0, 0, 330))
    .then(() => sleep(1))
    .then(() => driver.setPWM(0, 0, 150))
    .then(() => driver.setPWM(1, 0, 180))
    .then(() => sleep(1))
};

driver.init()
  .then(() => driver.setPWMFreq(50))  
  .then(() => sfdc.init(onPlatformEvent))
  .catch(error => {
    LOG.error(error);
  });
