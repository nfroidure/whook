import { describe, expect, test } from '@jest/globals';

import {
  fixAWSSchedule,
  parseDayOfTheWeekToAWSCron,
} from './terraformValues.js';

describe('parseDayOfTheWeekToAWSCron', () => {
  test('should return 1 when passing 0', async () => {
    expect(parseDayOfTheWeekToAWSCron('0')).toBe('1');
  });

  test('should return 5 when passing 4', async () => {
    expect(parseDayOfTheWeekToAWSCron('4')).toBe('5');
  });

  test('should return 1 when passing 7', async () => {
    expect(parseDayOfTheWeekToAWSCron('7')).toBe('1');
  });

  test('should return itself if the value is not an number', async () => {
    expect(parseDayOfTheWeekToAWSCron('*')).toBe('*');
  });

  test('should return a list of days +1 separated by a comma', async () => {
    expect(parseDayOfTheWeekToAWSCron('1,2,3')).toBe('2,3,4');
  });

  test('should return a list of days +1 separated by a comma', async () => {
    expect(parseDayOfTheWeekToAWSCron('1,7')).toBe('2,1');
  });
});

describe('fixAWSSchedule', () => {
  test('should return the fixed schedule', async () => {
    expect(fixAWSSchedule('0 0 * * *')).toBe('cron(0 0 * * ? *)');
  });

  test('should return the fixed schedule', async () => {
    expect(fixAWSSchedule('0 0 * * 0')).toBe('cron(0 0 ? * 1 *)');
  });

  test('should return the fixed schedule', async () => {
    expect(fixAWSSchedule('0 0 * * 1,7,4')).toBe('cron(0 0 ? * 2,1,5 *)');
  });

  test('should return the fixed interval schedule', async () => {
    expect(fixAWSSchedule('0 3 * * 1-6')).toBe('cron(0 3 ? * 2-7 *)');
  });

  test('should return the fixed interval schedule', async () => {
    expect(fixAWSSchedule('0 3 * * 3-1')).toBe('cron(0 3 ? * 4-2 *)');
  });

  test('should throw a YError if the schedule is not valid', async () => {
    expect(() => fixAWSSchedule('0 * 0 * 0')).toThrow();
  });
});
