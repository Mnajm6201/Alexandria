import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class CustomPasswordValidator:
    """
    Validate that the password meets these requirements:
    1. At least 8 characters long
    2. Contains at least 1 uppercase letter
    3. Contains at least 1 special character
    4. Contains at least 1 lowercase letter
    5. Contains at least 1 digit
    """

    def validate(self, password, user=None):
        # Checking for minimum length
        if len(password) < 8:
            raise ValidationError(
                _("Password must be at least 8 characters long."),
                code='password_too_short',
            )


        # Check for at least a upper case character
        if not re.search(r'[A-Z]', password):
            raise  ValidationError(
                _("Password must contain a capital letter."),
                code='password_no_upper',
            )


        # check for at least a special character
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(
                _("Password must contain a special character."),
                code="password_no_special",
            )


        # check for at least 1 lowercase
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Password must contain a lowercase character."),
                code="password_no_lower"
            )


        # check for at least 1 digit
        if not re.search(r'\d', password):
            raise ValidationError(
                _('Password must contain a digit.'),
                code="password_no_digit",
            )


    def get_help_text(self):
        return _(
                "Your password must contain at least 8 characters, including uppercase, " 
                "lowercase, digits, and special characters."
        )