const environmentConfig = require('../../config/env');

function buildPaginationOptions(queryParams) {
  const requestedPage = Number(queryParams.page || 1);
  const requestedPageSize = Number(queryParams.pageSize || environmentConfig.defaultPageSize);

  const page = requestedPage > 0 ? requestedPage : 1;
  const pageSize = Math.min(
    requestedPageSize > 0 ? requestedPageSize : environmentConfig.defaultPageSize,
    environmentConfig.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset
  };
}

module.exports = {
  buildPaginationOptions
};
