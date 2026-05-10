const policiesService = require('./policies.service');

async function getPoliciesByPatientId(request, response) {
  const policies = await policiesService.getPoliciesByPatientId(request.params.patientId);
  response.status(200).json(policies);
}

async function getPolicyById(request, response) {
  const policy = await policiesService.getPolicyById(request.params.policyId);
  response.status(200).json(policy);
}

async function getCoveragesByPolicyId(request, response) {
  const coverages = await policiesService.getCoveragesByPolicyId(request.params.policyId);
  response.status(200).json(coverages);
}

module.exports = {
  getPoliciesByPatientId,
  getPolicyById,
  getCoveragesByPolicyId
};
