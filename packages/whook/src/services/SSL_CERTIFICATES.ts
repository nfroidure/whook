import { name, autoService, location } from 'knifecycle';
import { YError } from 'yerror';
import { readFile as _readFile } from 'node:fs/promises';
import { noop, type LogService } from 'common-services';

const DEFAULT_ENV: WhookSSLCertificatesEnv = {};

export interface WhookSSLCertificatesEnv {
  SSL_KEY_PATH?: string;
  SSL_CERT_PATH?: string;
  SSL_CA_PATH?: string;
}
export interface WhookSSLCertificatesDependencies {
  ENV?: WhookSSLCertificatesEnv;
  readFile?: typeof _readFile;
  log?: LogService;
}
export interface WhookSSLCertificatesService {
  key: string | Buffer;
  cert: string | Buffer;
  ca?: string | Buffer;
}

/* Architecture Note #2.12.2: SSL Certificates

A service to load certificates from the environment vars.
*/

/**
 * Initialize an SSL certificate service
 * @name initSSLCertificates
 * @function
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   [services.ENV]
 * The process environment variables
 * @param  {Function} [services.log=noop]
 * A logging function
 * @return {Promise<SSLCertificates>}
 * A promise of an object with certificates contents.
 */
async function initSSLCertificates({
  ENV = DEFAULT_ENV,
  readFile = _readFile,
  log = noop,
}: WhookSSLCertificatesDependencies): Promise<WhookSSLCertificatesService> {
  if (!ENV?.SSL_KEY_PATH) {
    throw new YError('E_MISSING_ENV_VAR', ['SSL_KEY_PATH']);
  }
  if (!ENV.SSL_CERT_PATH) {
    throw new YError('E_MISSING_ENV_VAR', ['SSL_CERT_PATH']);
  }

  log('debug', `🔐 - Loading SSL key from: "${ENV.SSL_KEY_PATH}"`);
  log('debug', `🔐 - Loading SSL cert from: "${ENV.SSL_CERT_PATH}"`);

  try {
    const [key, cert, ca] = await Promise.all([
      readFile(ENV.SSL_KEY_PATH),
      readFile(ENV.SSL_CERT_PATH),
      ENV.SSL_CA_PATH ? readFile(ENV.SSL_CA_PATH) : Promise.resolve(undefined),
    ]);

    const sslCertificates: WhookSSLCertificatesService = {
      key,
      cert,
      ...(ca ? { ca } : {}),
    };

    return sslCertificates;
  } catch (err) {
    throw YError.wrap(err as Error, 'E_CANNOT_READ_SSL_FILES', [
      ENV?.SSL_KEY_PATH,
      ENV?.SSL_CERT_PATH,
      ENV?.SSL_CA_PATH,
    ]);
  }
}

export default location(
  name('SSL_CERTIFICATES', autoService(initSSLCertificates)),
  import.meta.url,
);
