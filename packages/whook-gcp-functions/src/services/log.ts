import { service } from 'knifecycle';

// eslint-disable-next-line
export default service(async () => console.log.bind(console), 'log');
