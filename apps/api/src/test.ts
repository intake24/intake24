import axios from 'axios';

async function main() {
  const res = await axios.get('https://api.rivm.nl/v1/p_Antwoordoptiesets?pageNumber=1&pageSize=100', {});
  console.log(res);
}

main().catch((err) => {
  console.log(err);
});
