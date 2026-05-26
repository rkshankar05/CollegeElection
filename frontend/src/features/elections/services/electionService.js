import api from "../../../api/apiClient";

export async function getElections() {
  const res = await api.get("/elections/");
  return res.data;
}

export async function getElectionPosts(id) {
  const res = await api.get(`/elections/${id}/posts`);
  return res.data;
}

export async function getPublishedCandidates(id) {
  const res = await api.get(`/elections/${id}/published-candidates`);
  return res.data;
}
