const { retry } = require('./tools');

const URL_GOOGLE_FCM = 'https://android.clients.google.com/c2dm/register3'
const USER_AGENT = 'Android-GCM/1.5 (victara MPES24.49-18-7)';
const DEVICE = '3580873862227064803';
const DEVICE_COMPLEMENT = '6185646517745801705';
const last = {};

const randomString = (length) => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

const request = async () => {
  const hash = randomString(11);

  const params = {
    'X-subtype': '905942954488',
    'sender': '905942954488',
    'X-app_ver': '49',
    'X-osv': '23',
    'X-cliv': 'fiid-12451000',
    'X-gmsv': '17785018',
    'X-appid': hash,
    'X-scope': '*',
    'X-gmp_app_id': '1%3A905942954488%3Aandroid%3Ad9d949bd7721de40',
    'X-app_ver_name': '4.7.4',
    'app': 'br.gov.sinesp.cidadao.android',
    'device': DEVICE,
    'app_ver': '49',
    'info': 'szkyZ1yvKxIbENW7sZq6nvlyrqNTeRY',
    'gcm_ver': '17785018',
    'plat': '0',
    'cert': 'daf1d792d60867c52e39c238d9f178c42f35dd98',
    'target_ver': '26',
  };

  const body = Object.entries(params).map((entry) => `${entry[0]}=${entry[1]}`).join('&');

  const headers = {
    'user-agent': USER_AGENT,
    'Authorization': `AidLogin ${DEVICE}:${DEVICE_COMPLEMENT}`,
    'Content-type': 'application/x-www-form-urlencoded',
    'app': 'br.gov.sinesp.cidadao.android',
    gcm_ver: '17785018',
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

const getValidToken = async () => {
  if (last.time === undefined || diff(last.time) >= 30) {
    last.time = new Date();
    last.token = await request();
  }

  return last.token;
};

module.exports = {
  getValidToken,
};
