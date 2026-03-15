from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def verify_google_token(token):
    try:
        # Your web application's client ID
        WEB_CLIENT_ID = "901665380294-lhur8lkcqkdt1d0e9b5q3p25mknfejbs.apps.googleusercontent.com"
        # Your Android application's client ID
        ANDROID_CLIENT_ID = "901665380294-c18bfaq4sqlgnelllpvm9nhf2m5upvue.apps.googleusercontent.com"
        
        # Try web client ID first
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), WEB_CLIENT_ID)

        except ValueError:
            # If web client ID fails, try Android client ID
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), ANDROID_CLIENT_ID)
        
        # Verify that the token is for your application
        if idinfo['aud'] not in [WEB_CLIENT_ID, ANDROID_CLIENT_ID]:
            raise ValueError('Wrong audience.')
            
        # Get user info from token
        user_info = {
            'email': idinfo['email'],
            'full_name': idinfo.get('name'),
            'picture': idinfo.get('picture')
        }
        
        return user_info
        
    except ValueError as e:
        print("Google token validation error:", str(e))
        return None