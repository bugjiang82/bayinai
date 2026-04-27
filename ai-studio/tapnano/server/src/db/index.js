/**
 * Database layer — re-exports from SQLite implementation
 */
export {
  initDatabase,
  saveCanvas,
  loadCanvas,
  listCanvases,
  deleteCanvas,
  getSettings,
  getRawSettings,
  updateSettings,
  addApiKey,
  removeApiKey,
  setActiveApiKey,
  createUser,
  findUserByUsername,
  findUserById,
  getPendingUsers,
  approveUser,
  rejectUser,
  listAllUsers,
  db
} from './sqlite.js'
