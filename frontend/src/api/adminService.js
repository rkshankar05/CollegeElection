import api from "./apiClient";

export async function addStudent(data) {
  const res = await api.post(
    "/admin/students",
    null,
    {
      params: {
        roll_number: data.roll_number,
        college_email: data.college_email,
        name: data.name,
        has_active_backlog:
          data.has_active_backlog,
      },
    }
  );

  return res.data;
}

export async function uploadStudentsFile(file) {
  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  const res = await api.post(
    "/admin/students/upload-csv",
    formData
  );

  return res.data;
}

export async function createElection(data) {
  const res =
    await api.post(
      "/admin/elections",
      data
    );

  return res.data;
}

export async function updateElection(electionId, data) {
  const res = await api.patch(`/admin/elections/${electionId}`, data);
  return res.data;
}

export async function createPost(data) {
  const res =
    await api.post(
      "/admin/posts",
      data
    );

  return res.data;
}

export async function getAllStudents() {
  const res = await api.get("/admin/students");
  return res.data;
}

export async function deleteStudent(studentId) {
  const res = await api.delete(`/admin/students/${studentId}`);
  return res.data;
}

export async function updateStudent(studentId, data) {
  const res = await api.patch(`/admin/students/${studentId}`, data);
  return res.data;
}

export async function updateCandidateBlock(
  studentId,
  candidateBlocked,
  blockReason = null
) {
  const res = await api.patch(
    `/admin/students/${studentId}/candidate-block`,
    {
      candidate_blocked: candidateBlocked,
      block_reason: candidateBlocked
        ? (blockReason || "Blocked by admin")
        : null,
    }
  );

  return res.data;
}
export async function deleteElection(electionId) {
  const res = await api.delete(`/admin/elections/${electionId}`);
  return res.data;
}

export async function publishCandidates(electionId) {
  const res = await api.patch(`/admin/elections/${electionId}/publish-candidates`);
  return res.data;
}

export async function publishResult(electionId) {
  const res = await api.patch(`/admin/elections/${electionId}/publish-result`);
  return res.data;
}

export async function unpublishCandidates(electionId) {
  const res = await api.patch(`/admin/elections/${electionId}/unpublish-candidates`);
  return res.data;
}

export async function unpublishResult(electionId) {
  const res = await api.patch(`/admin/elections/${electionId}/unpublish-result`);
  return res.data;
}

export async function getAllApplications() {
  const res = await api.get("/admin/candidates/applications");
  return res.data;
}
