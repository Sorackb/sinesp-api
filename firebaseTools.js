const { retry } = require('./tools');

const URL_GOOGLE_FCM = 'https://android.clients.google.com/c2dm/register3';
const SUBTYPE = '905942954488';
const USER_AGENT = 'Android-GCM/1.5 (victara MPES24.49-18-7)';
const GMC_VERSION = '17785018';
const APP_SEQUENCE = '49';
const DEVICE = '3580873862227064803';
const DEVICE_COMPLEMENT = '6185646517745801705';
const vault = {};

const randomString = (length) => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const request = async (appVersion) => {
  const hash = randomString(11);

  const params = {
    'X-subtype': SUBTYPE,
    'X-app_ver': APP_SEQUENCE,
    'X-osv': '23',
    'X-cliv': 'fiid-12451000',
    'X-gmsv': GMC_VERSION,
    'X-appid': hash,
    'X-scope': '*',
    'X-gmp_app_id': '1%3A905942954488%3Aandroid%3Ad9d949bd7721de40',
    'X-app_ver_name': appVersion,
    sender: SUBTYPE,
    app: 'br.gov.sinesp.cidadao.android',
    device: DEVICE,
    app_ver: APP_SEQUENCE,
    info: 'szkyZ1yvKxIbENW7sZq6nvlyrqNTeRY',
    gcm_ver: GMC_VERSION,
    plat: '0',
    cert: 'daf1d792d60867c52e39c238d9f178c42f35dd98',
    target_ver: '26',
  };

  const body = Object.entries(params).map((entry) => `${entry[0]}=${entry[1]}`).join('&');

  const headers = {
    'User-agent': USER_AGENT,
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `AidLogin ${DEVICE}:${DEVICE_COMPLEMENT}`,
    app: 'br.gov.sinesp.cidadao.android',
    gcm_ver: GMC_VERSION,
  };

  const options = {
    body,
    headers,
    method: 'POST',
    url: URL_GOOGLE_FCM,
  };

  const response = await retry(options);

  return response.replace('token=', '');
};

const diff = (old) => (new Date() - old) / 60000;

const getValidToken = async (appVersion) => {
  const last = vault[appVersion] || {};

  if (!vault[appVersion]) vault[appVersion] = last;

  if (last.time === undefined || diff(last.time) >= 30) {
    last.time = new Date();
    last.token = await request(appVersion);
  }

  return last.token;
};

module.exports = {
  getValidToken,
};
