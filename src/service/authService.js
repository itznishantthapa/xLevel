// src/service/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
import { API } from '../api/client';
import { endpoints } from '../api/endpoints';






export const signupUser = async (payload) => {
  try {
    const response = await API.post(endpoints.signup, payload);
    const { tokens, user } = response.data;

    await AsyncStorage.multiSet([
      ['@access_token', tokens.access],
      ['@refresh_token', tokens.refresh],
      ['@user', JSON.stringify(user)]
    ]);


    return user;
  } catch (error) {
    // Handle API error response with proper message
    if (error.response && error.response.data && error.response.data.message) {
      Toast.show(error.response.data.meYssage);
    } else {
      Toast.show('Signup failed. Please try again.');
    }
    throw error;
  }
};




export const googleSignupUser = async (payload) => {
  try {
    const response = await API.post(endpoints.googleSignup, payload);
    const { tokens, user, message } = response.data;

    await AsyncStorage.multiSet([
      ['@access_token', tokens.access],
      ['@refresh_token', tokens.refresh],
      ['@user', JSON.stringify(user)]
    ]);

    return user;
  } catch (error) {
 
      Toast.show(error.message);
 
  }
};

export const appleSignupUser = async (payload) => {
  try {
    const response = await API.post(endpoints.appleSignup, payload);
    console.log('Apple Signup Response:', response.data);
    const { tokens, user } = response.data;

    await AsyncStorage.multiSet([
      ['@access_token', tokens.access],
      ['@refresh_token', tokens.refresh],
      ['@user', JSON.stringify(user)]
    ]);
    return user;
  } catch (error) {
    Toast.show(error?.response?.data?.message || error.message || 'Apple Sign-In failed.');
  }
};



export const loginUser = async (payload) => {
  try {
    const response = await API.post(endpoints.login, payload);
    const { tokens, user } = response.data;

    if (tokens?.access && tokens?.refresh && user) {
      await AsyncStorage.multiSet([
        ['@access_token', tokens.access],
        ['@refresh_token', tokens.refresh],
        ['@user', JSON.stringify(user)],
      ]);
      return user;
    }

    throw new Error('Incomplete login data received.');
  } catch (error) {
    throw error;
  }
};





export const getStoredUser = async () => {
  const token = await AsyncStorage.getItem('@access_token');
  const user = await AsyncStorage.getItem('@user');
  return token && user ? JSON.parse(user) : null;
};












export const updateUser = async (payload) => {

  try{
  const response = await API.put(endpoints.updateUser, payload, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  const {user, message} = response.data;
  await AsyncStorage.setItem('@user', JSON.stringify(user));
  return user;
} catch (error) {

  if (error.response && error.response.data && error.response.data.message) {
    Toast.show(error.response.data.message);
  } else {
    Toast.show('Profile update failed. Please try again.');
  }
  throw error;
}
}



// delete user account 

export const deleteUser = async (payload) => {
  try {
    const response = await API.delete(endpoints.deleteUser, {
      data: payload,
      headers: { 'Content-Type': 'application/json' }
    });
    return response;
  } catch (error) {
    Toast.show(error?.message || 'Account deletion failed. Please try again.');
  }
};

// need to implement===================================
export const getUser = async () => {
  try{
    const response = await API.get(endpoints.getUser);
    const {   user } = response.data;
    await AsyncStorage.setItem('@user', JSON.stringify(user));
    return user;
  }catch(error){
    if (__DEV__) console.log(error)
  }

}