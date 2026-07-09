// api/endpoints.js
// Centralized API route paths for easy maintenance

import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

export const endpoints = {
  // Auth
  signup: "/api/user/signup/",
  login: "/api/user/login/",
  getUser: "/api/user/get-user/",
  updateUser: "/api/user/update-profile/",
  deleteUser: "/api/user/delete-account/",
  googleSignup: "/api/user/google/auth/",
  appleSignup: "/api/user/apple/auth/",
  refreshUserData: "/api/auth/refresh-user-data/",
  refreshToken: "/api/user/refresh-token/",
  updateGamePoints: "/api/user/update-game-points/",
  blockUser:"/api/user/block-user/",
  unblockUser:"/api/user/unblock-user/",
  getBlockedUsers:"/api/user/blocked-users/",

  //points
  getPointsIn: "/api/points/in/",
  getPointsOut: "/api/points/out/",
  getPointsHistory: "/api/points/history/",
  createDynamicTransaction: "/api/points/create-dynamic-transaction/",


  // Notifications
  postFCMToken: "/api/notification/save-fcm-token/",
  deleteFCMToken: "/api/notification/delete-fcm-token/",
  getUserNotificationsOnLoads: "/api/notification/user-notifications-on-loads/",
  getBanners: "/api/notification/banners/",

  // Games
  games: "/api/games/",
  getGameProfiles: "/api/games/profiles/",
  saveGameProfile: "/api/games/profiles/save/",
  getGameRules: "/api/games/rules/",

  // Challenges
  getUpcomingGames: "/api/challenges/official/",
  getOpenChallenges: "/api/challenges/customer-challenges/",
  createChallenge: "/api/challenges/create/",
  joinChallenge: "/api/challenges/join/",
  submitResult: "/api/results/submit/",
  getResult:"/api/results/get_result/",


  updateOnChallenge: "/api/challenges/update-on-challenge/",
  deleteChallenge: "/api/challenges/cancel/",
  leaveChallenge: "/api/challenges/leave/",



  getMatchesOnLoads: "/api/challenges/get-user-matches-on-loads/",
  getOpenChallengesOnLoads: "/api/challenges/get-open-challenges-on-loads/",
  getTournamentsOnLoads: "/api/challenges/get-user-tournaments-on-loads/",
  confirmOpponent: "/api/challenges/confirm-opponent/",


  //reports
  submitReport:"/api/reports/create/",
  getReports:"/api/reports/my-reports/",

  //Guides
  getGuides:"/api/guide/",

  //utils
  getUtils:"/api/utils/",

  //store
  getStoreItems: "/api/store/items/",
  placeTopup: "/api/store/topup/",

  //buysell
  getGameAccountsOnLoads: "/api/buysell/accounts/",
  createGameAccount: "/api/buysell/accounts/create/",
  deleteGameAccount: "/api/buysell/accounts/delete/",
  purchaseGameAccount: "/api/buysell/accounts/purchase/",
  
};


