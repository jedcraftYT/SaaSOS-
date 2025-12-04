"""
Custom exception handler for consistent API error responses.
All errors return JSON in the format:
{
    "success": false,
    "message": "Error description",
    "data": {"errors": {...}}
}
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent JSON responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # If response is None, it's not a DRF exception
    if response is None:
        # Handle Django's Http404
        if isinstance(exc, Http404):
            return Response({
                'success': False,
                'message': 'Resource not found.',
                'data': {'errors': {'detail': str(exc)}}
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Handle Django's PermissionDenied
        if isinstance(exc, DjangoPermissionDenied):
            return Response({
                'success': False,
                'message': 'Permission denied.',
                'data': {'errors': {'detail': str(exc)}}
            }, status=status.HTTP_403_FORBIDDEN)
        
        # For other exceptions, return 500
        return Response({
            'success': False,
            'message': 'An unexpected error occurred.',
            'data': {'errors': {'detail': str(exc)}}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Customize DRF exception responses
    custom_response = {
        'success': False,
        'message': get_error_message(response.status_code, response.data),
        'data': {'errors': response.data}
    }

    return Response(custom_response, status=response.status_code)


def get_error_message(status_code, data):
    """
    Generate a user-friendly error message based on status code.
    """
    messages = {
        400: 'Bad request. Please check your input.',
        401: 'Authentication required. Please log in.',
        403: 'You do not have permission to access this resource.',
        404: 'Resource not found.',
        405: 'Method not allowed.',
        409: 'Conflict. Resource already exists.',
        429: 'Too many requests. Please try again later.',
        500: 'Internal server error. Please try again later.',
    }
    
    # Try to extract detail message from data
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        if 'non_field_errors' in data:
            return str(data['non_field_errors'][0])
    
    return messages.get(status_code, 'An error occurred.')
