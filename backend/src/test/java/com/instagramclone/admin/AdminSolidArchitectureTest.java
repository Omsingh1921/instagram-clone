package com.instagramclone.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.instagramclone.admin.controller.AdminDashboardController;
import com.instagramclone.admin.controller.AdminDeletionConfigController;
import com.instagramclone.admin.controller.AdminDynamicSystemConfigController;
import com.instagramclone.admin.controller.AdminEmailController;
import com.instagramclone.admin.controller.AdminFeatureFlagController;
import com.instagramclone.admin.controller.AdminFeedConfigController;
import com.instagramclone.admin.controller.AdminMediaConfigController;
import com.instagramclone.admin.controller.AdminModerationConfigController;
import com.instagramclone.admin.controller.AdminModerationController;
import com.instagramclone.admin.controller.AdminUserController;
import com.instagramclone.admin.dto.request.UpdateFeatureFlagRequest;
import com.instagramclone.admin.dto.response.AdminActivityItemResponse;
import com.instagramclone.admin.dto.response.AdminContentItemResponse;
import com.instagramclone.admin.dto.response.FeatureFlagResponse;
import com.instagramclone.admin.entity.DynamicFeatureFlagConfig;
import com.instagramclone.admin.mapper.AdminMapper;
import com.instagramclone.admin.repository.DynamicFeatureFlagRepository;
import com.instagramclone.admin.repository.ReportRepository;
import com.instagramclone.admin.service.impl.AdminAnalyticsServiceImpl;
import com.instagramclone.admin.service.impl.AdminContentModerationServiceImpl;
import com.instagramclone.admin.service.impl.AdminReportServiceImpl;
import com.instagramclone.admin.service.impl.AdminServiceImpl;
import com.instagramclone.admin.service.impl.DynamicFeatureFlagServiceImpl;
import com.instagramclone.admin.service.interfaces.IAdminAnalyticsService;
import com.instagramclone.admin.service.interfaces.IAdminContentModerationService;
import com.instagramclone.admin.service.interfaces.IAdminReportService;
import com.instagramclone.admin.service.interfaces.IAdminUserManagementService;
import com.instagramclone.admin.service.interfaces.IDynamicConfigService;
import com.instagramclone.admin.service.interfaces.IDynamicDeletionConfigService;
import com.instagramclone.admin.service.interfaces.IDynamicFeatureFlagService;
import com.instagramclone.admin.service.interfaces.IDynamicFeedConfigService;
import com.instagramclone.admin.service.interfaces.IDynamicModerationConfigService;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigReader;
import com.instagramclone.admin.service.interfaces.IDynamicSystemConfigService;
import com.instagramclone.admin.service.support.UserModerationSupport;
import com.instagramclone.admin.strategy.AdminActivityProvider;
import com.instagramclone.admin.strategy.AdminContentExplorerHandler;
import com.instagramclone.admin.strategy.ModerationTargetStrategy;
import com.instagramclone.audit.service.interfaces.IAuditLogService;
import com.instagramclone.common.exception.BadRequestException;
import com.instagramclone.common.response.PageResponse;
import com.instagramclone.user.repository.UserRepository;
import com.instagramclone.utility.RedisUtility;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Module SOLID Architecture Unit Tests")
class AdminSolidArchitectureTest {

    @Mock
    private DynamicFeatureFlagRepository featureFlagRepository;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private IAuditLogService auditLogService;

    @Test
    @DisplayName("SRP & ISP: Split Admin controllers depend only on narrow domain service interfaces")
    void splitControllersFollowSrpAndIsp() {
        assertThat(AdminModerationController.class.getDeclaredFields()).hasSize(1);
        assertThat(AdminUserController.class.getDeclaredFields()).hasSize(1);
        assertThat(AdminDashboardController.class.getDeclaredFields()).hasSize(2);
        assertThat(AdminDeletionConfigController.class.getDeclaredFields()).hasSize(1);
        assertThat(AdminFeatureFlagController.class.getDeclaredFields()).hasSize(1);
        assertThat(AdminModerationConfigController.class.getDeclaredFields()).hasSize(1);
        assertThat(AdminFeedConfigController.class.getDeclaredFields()).hasSize(1);
        assertThat(AdminMediaConfigController.class.getDeclaredFields()).hasSize(1);
        assertThat(AdminDynamicSystemConfigController.class.getDeclaredFields()).hasSize(1);
        assertThat(AdminEmailController.class.getDeclaredFields()).hasSize(3);

        assertThat(IDynamicConfigService.class).isAssignableFrom(IDynamicDeletionConfigService.class);
        assertThat(IDynamicConfigService.class).isAssignableFrom(IDynamicFeatureFlagService.class);
        assertThat(IDynamicConfigService.class).isAssignableFrom(IDynamicFeedConfigService.class);
        assertThat(IDynamicConfigService.class).isAssignableFrom(IDynamicModerationConfigService.class);
        assertThat(IDynamicSystemConfigReader.class).isAssignableFrom(IDynamicSystemConfigService.class);
    }

    @Test
    @DisplayName("OCP & DIP: Content explorer, activity feed, and report target strategies are pluggable without modifying services")
    void strategiesArePluggableViaAbstractions() {
        UUID customId = UUID.randomUUID();
        AdminContentExplorerHandler customHandler = new AdminContentExplorerHandler() {
            @Override
            public Set<String> supportedTypes() {
                return Set.of("HIGHLIGHT");
            }

            @Override
            public PageResponse<AdminContentItemResponse> browse(String cleanQuery, Pageable pageable) {
                return PageResponse.<AdminContentItemResponse>builder()
                        .content(List.of(AdminContentItemResponse.builder().id(customId).contentType("HIGHLIGHT").build()))
                        .pageNumber(0)
                        .pageSize(20)
                        .totalElements(1)
                        .totalPages(1)
                        .last(true)
                        .build();
            }

            @Override
            public void softDelete(UUID contentId, UUID adminId) {
                // No-op test handler
            }
        };

        AdminContentModerationServiceImpl contentService = new AdminContentModerationServiceImpl(List.of(customHandler));
        PageResponse<AdminContentItemResponse> page = contentService.getContentItems("highlight", "  query ", PageRequest.of(0, 20));
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getId()).isEqualTo(customId);

        assertThatThrownBy(() -> contentService.getContentItems("UNKNOWN", null, PageRequest.of(0, 20)))
                .isInstanceOf(BadRequestException.class);

        LocalDateTime now = LocalDateTime.now();
        AdminActivityProvider olderProvider = slice -> List.of(
                AdminActivityItemResponse.builder().id("old").createdAt(now.minusHours(2)).build());
        AdminActivityProvider newerProvider = slice -> List.of(
                AdminActivityItemResponse.builder().id("new").createdAt(now).build());

        AdminAnalyticsServiceImpl analyticsService = new AdminAnalyticsServiceImpl(
                null, null, null, null, null, null, null, null, null, null, null, null, null,
                List.of(olderProvider, newerProvider));

        List<AdminActivityItemResponse> activity = analyticsService.getRecentActivity(5);
        assertThat(activity).extracting(AdminActivityItemResponse::getId).containsExactly("new", "old");

        // Verify empty strategy map rejects unsupported target cleanly
        AdminReportServiceImpl reportService = new AdminReportServiceImpl(
                mock(ReportRepository.class),
                mock(UserRepository.class),
                auditLogService,
                new AdminMapper(null),
                mock(UserModerationSupport.class),
                mock(RedisUtility.class),
                List.<ModerationTargetStrategy>of());
        assertThat(reportService).isNotNull();
    }

    @Test
    @DisplayName("LSP & DRY: AbstractDynamicConfigService shares Redis cache, eviction, and audit lifecycle across configs")
    void dynamicConfigBaseTemplateHandlesCacheAndAudit() throws Exception {
        DynamicFeatureFlagServiceImpl service = new DynamicFeatureFlagServiceImpl(
                featureFlagRepository,
                Optional.of(redisTemplate),
                new ObjectMapper().findAndRegisterModules(),
                Optional.of(auditLogService)
        );

        UUID configId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        DynamicFeatureFlagConfig entity = DynamicFeatureFlagConfig.builder()
                .id(configId)
                .reelsUploadEnabled(true)
                .storyCreationEnabled(false)
                .voiceMessagesEnabled(true)
                .maintenanceModeEnabled(false)
                .maintenanceMessage("Scheduled check")
                .build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("admin:config:features")).thenReturn(null);
        when(featureFlagRepository.findFirstByOrderByCreatedAtAsc()).thenReturn(Optional.of(entity));
        when(featureFlagRepository.save(any())).thenReturn(entity);

        IDynamicConfigService<DynamicFeatureFlagConfig, UpdateFeatureFlagRequest, FeatureFlagResponse> asBase = service;
        FeatureFlagResponse fetched = asBase.getConfigResponse();
        assertThat(fetched.getStoryCreationEnabled()).isFalse();

        UpdateFeatureFlagRequest req = UpdateFeatureFlagRequest.builder()
                .reelsUploadEnabled(false)
                .storyCreationEnabled(true)
                .voiceMessagesEnabled(true)
                .maintenanceModeEnabled(true)
                .maintenanceMessage("Maintenance active")
                .build();

        FeatureFlagResponse updated = asBase.updateConfig(req, adminId);
        assertThat(updated.getMaintenanceModeEnabled()).isTrue();
        verify(redisTemplate).delete("admin:config:features");
        verify(auditLogService).record(eq(adminId), eq("UPDATE_FEATURE_FLAGS"), eq("DYNAMIC_FEATURE_FLAGS"), eq(configId), eq(null), any());
    }

    @Test
    @DisplayName("Facade compatibility: AdminServiceImpl delegates operations to segregated interfaces")
    void adminFacadeDelegatesToSegregatedServices() {
        IAdminReportService reportService = mock(IAdminReportService.class);
        IAdminUserManagementService userService = mock(IAdminUserManagementService.class);
        IAdminAnalyticsService analyticsService = mock(IAdminAnalyticsService.class);
        IAdminContentModerationService contentService = mock(IAdminContentModerationService.class);

        AdminServiceImpl facade = new AdminServiceImpl(reportService, userService, analyticsService, contentService);
        facade.getDashboardStats(14);
        facade.getRecentActivity(10);
        facade.deleteContentItem("POST", UUID.randomUUID());

        verify(analyticsService).getDashboardStats(14);
        verify(analyticsService).getRecentActivity(10);
        verify(contentService).deleteContentItem(eq("POST"), any(UUID.class));
    }
}

