import api from "../../../api/apiClient";

export async function getMyApplications() {
  const res = await api.get("/candidates/my-applications");
  return res.data;
}

export async function applyCandidate(data) {
  const res = await api.post("/candidates/apply", data);
  return res.data;
}

export async function getAllAdminCandidates() {
  const res = await api.get("/candidates/admin/all");
  return res.data;
}

export async function reviewCandidate(candidateId, data) {
  const res = await api.patch(
    `/candidates/admin/${candidateId}/review`,
    data
  );
  return res.data;
}

export async function getPublicCandidates(electionId) {
  const res = await api.get(
    `/candidates/election/${electionId}/public`
  );
  return res.data;
}
