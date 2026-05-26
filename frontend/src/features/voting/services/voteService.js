import api from "../../../api/apiClient";

export async function submitVote(data) {
  const res = await api.post("/votes/submit", data);
  return res.data;
}

export async function getResults(electionId) {
  const res = await api.get(`/votes/results/${electionId}`);
  return res.data;
}

export async function getLiveResults(electionId) {
  const res = await api.get(`/votes/admin/live-results/${electionId}`);
  return res.data;
}
