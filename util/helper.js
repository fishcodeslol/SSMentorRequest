import axios from "axios";

let championList;

export function checkAdmin(user) {
  // console.log("checkAdmin: ", user);
  if (!user) return false;
  return user.isAdmin || user?.userType == "admin";
}

export function checkMentor(user) {
  if (!user) return false;
  return checkAdmin(user) || user.isMentor || user?.userType == "mentor";
}

export function checkReviewer(user) {
  return user?.isReviewer;
}

export function copyClip(text) {
  navigator.clipboard.writeText(text);
}

export async function getAllChampions() {
  if (championList) return championList;

  const versions = await axios.get(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  const latestVersion = versions.data[0];
  const request = await axios.get(
    `http://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
  );
  const tempList = [];
  for (let champion in request.data.data) {
    tempList.push(request.data.data[champion].name);
  }
  tempList.sort();
  championList = tempList;
  return tempList;
}
