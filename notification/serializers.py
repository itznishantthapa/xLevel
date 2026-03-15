from rest_framework import serializers
from .models import Notification, Banner

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'image', 'url']

class NotificationSerializer(serializers.ModelSerializer):
    notification_created_at = serializers.DateTimeField(source='created_at')
    room = serializers.SerializerMethodField()
    challenge = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'message',
            'notification_created_at', 'room', 'challenge'
        ]

    def get_room(self, obj):
        if obj.notification_type == 'game':
            room_data = {}
            
            # Include room credentials if available
            if obj.room_id and obj.room_pass:
                room_data.update({
                    'room_id': obj.room_id,
                    'room_pass': obj.room_pass
                })
            
            # Include team code if available
            if obj.team_code:
                room_data['team_code'] = obj.team_code
            
            # Include lobby_id if available (for MLBB)
            if obj.lobby_id:
                room_data['lobby_id'] = obj.lobby_id
            
            # Return room data if we have any credentials
            return room_data if room_data else None
            
        return None

    def get_challenge(self, obj):
        if obj.challenge:
            return {
                'challenge_id': obj.challenge.id
            }
        return None