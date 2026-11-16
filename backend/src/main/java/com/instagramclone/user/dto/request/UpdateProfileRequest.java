package com.instagramclone.user.dto.request;

import com.instagramclone.common.constants.ValidationConstants;
import com.instagramclone.common.validation.annotation.TrimValidator;
import com.instagramclone.user.annotation.ValidBio;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TrimValidator
public class UpdateProfileRequest {

    @Pattern(regexp = ValidationConstants.USERNAME_REGEX, message = ValidationConstants.USERNAME_PATTERN_MESSAGE)
    @Size(min = ValidationConstants.USERNAME_MIN_LENGTH, max = ValidationConstants.USERNAME_MAX_LENGTH, message = ValidationConstants.USERNAME_LENGTH_MESSAGE)
    private String username;

    @Pattern(regexp = ValidationConstants.DISPLAY_NAME_REGEX, message = ValidationConstants.DISPLAY_NAME_PATTERN_MESSAGE)
    @Size(max = ValidationConstants.DISPLAY_NAME_MAX_LENGTH, message = ValidationConstants.DISPLAY_NAME_MAX_LENGTH_MESSAGE)
    private String displayName;

    @ValidBio
    private String bio;

    @Pattern(regexp = ValidationConstants.WEBSITE_URL_REGEX, message = ValidationConstants.URL_INVALID_MESSAGE)
    @Size(max = ValidationConstants.WEBSITE_URL_MAX_LENGTH, message = ValidationConstants.WEBSITE_URL_MAX_LENGTH_MESSAGE)
    private String websiteUrl;

    private String accountType;

    private String category;

    @Size(max = 50, message = "Pronouns cannot exceed 50 characters")
    private String pronouns;

    private String gender;

    private Boolean showCategoryBadge;

    @Email(message = "Contact email must be a valid email address")
    @Size(max = 255, message = "Contact email cannot exceed 255 characters")
    private String contactEmail;

    @Size(max = 50, message = "Contact phone cannot exceed 50 characters")
    private String contactPhone;

    private Boolean showContactInfo;
}
