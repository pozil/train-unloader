const { PwmDriver, sleep } = require('adafruit-i2c-pwm-driver-async');
import getLogger from '../utils/logger';
import Configuration from '../utils/configuration';

const logger = getLogger('Unloader');

export default class Unloader {
    constructor() {
        this.driver = new PwmDriver({
            address: 0x40,
            device: '/dev/i2c-1',
            debug: Configuration.isSerialDebugModeEnabled(),
            i2cDebug: false
          });
    }

    async connect() {
        logger.info('Connect');
        await this.driver.init();
        return this.driver.setPWMFreq(50);
    }

    async disconnect() {
        logger.info('Disconnect');
        return this.driver.stop();
    }

    async unload() {
        logger.info('Unload');
        await this.driver.setPWM(0, 0, 150);
        await this.driver.setPWM(1, 0, 180);
        await sleep(1);
        await this.driver.setPWM(1, 0, 500);
        await sleep(0.5);
        await this.driver.setPWM(0, 0, 330);
        await sleep(1);
        await this.driver.setPWM(0, 0, 150);
        await this.driver.setPWM(1, 0, 180);
        return sleep(1);
    }
}