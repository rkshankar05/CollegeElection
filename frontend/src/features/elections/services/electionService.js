import api from "../../../api/apiClient";

export async function getElections() {
  const res = await api.get("/elections/");
  return res.data;
}

export async function getElectionPosts(id) {
  const res = await api.get(`/elections/${id}/posts`);
  return res.data;
}
