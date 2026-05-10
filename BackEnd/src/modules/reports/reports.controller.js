const reportsService = require('./reports.service');

async function getReportById(request, response) {
  const report = await reportsService.getReportById(request.params.reportId);
  response.status(200).json(report);
}

async function getReportByValidationId(request, response) {
  const report = await reportsService.getReportByValidationId(request.params.validationId);
  response.status(200).json(report);
}

module.exports = {
  getReportById,
  getReportByValidationId
};
