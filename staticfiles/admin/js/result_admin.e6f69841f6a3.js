// Result Admin JavaScript
(function($) {
    'use strict';

    // Initialize when DOM is ready
    $(document).ready(function() {
        initializeResultAdmin();
    });

    function initializeResultAdmin() {
        // Enhanced screenshot interactions
        initializeScreenshotInteractions();
        
        // Winner selection enhancements
        initializeWinnerSelection();
        
        // Bulk actions
        initializeBulkActions();
        
        // Keyboard shortcuts
        initializeKeyboardShortcuts();
        
        // Auto-refresh functionality
        initializeAutoRefresh();
    }

    function initializeScreenshotInteractions() {
        // Image zoom on hover
        $('.screenshot-image').on('mouseenter', function() {
            $(this).closest('.screenshot-wrapper').addClass('zoomed');
        }).on('mouseleave', function() {
            $(this).closest('.screenshot-wrapper').removeClass('zoomed');
        });

        // Image comparison mode
        let comparisonMode = false;
        
        $('#toggle-comparison').on('click', function() {
            comparisonMode = !comparisonMode;
            $('.screenshots-grid').toggleClass('comparison-mode', comparisonMode);
            $(this).text(comparisonMode ? 'Exit Comparison' : 'Compare Side by Side');
        });

        // Image annotations (if needed for detailed review)
        $('.screenshot-image').on('dblclick', function(e) {
            const rect = this.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            
            addAnnotation($(this), x, y);
        });
    }

    function addAnnotation(imageElement, x, y) {
        const wrapper = imageElement.closest('.screenshot-wrapper');
        const annotation = $('<div class="annotation-point"></div>')
            .css({
                position: 'absolute',
                left: x + '%',
                top: y + '%',
                width: '12px',
                height: '12px',
                background: '#ff6b6b',
                border: '2px solid white',
                borderRadius: '50%',
                cursor: 'pointer',
                zIndex: 10
            });
        
        wrapper.css('position', 'relative').append(annotation);
        
        // Add click to remove
        annotation.on('click', function() {
            $(this).remove();
        });
    }

    function initializeWinnerSelection() {
        // Enhanced winner selection with animations
        $('.winner-option input[type="radio"]').on('change', function() {
            const selectedCard = $(this).siblings('.winner-label').find('.winner-card');
            
            // Remove previous selections
            $('.winner-card').removeClass('selected');
            $('.winner-option').removeClass('selected-option');
            
            // Add selection to current
            selectedCard.addClass('selected');
            $(this).closest('.winner-option').addClass('selected-option');
            
            // Enable confirm button
            $('#set-winner').prop('disabled', false).addClass('ready');
            
            // Show confirmation preview
            showWinnerPreview($(this));
        });

        // Quick winner selection shortcuts
        $(document).on('keydown', function(e) {
            if (e.altKey) {
                switch(e.key) {
                    case '1':
                        $('.winner-option').eq(0).find('input').click();
                        break;
                    case '2':
                        $('.winner-option').eq(1).find('input').click();
                        break;
                    case 'd':
                        $('#winner_draw').click();
                        break;
                }
            }
        });
    }

    function showWinnerPreview(selectedInput) {
        const winnerName = selectedInput.siblings('.winner-label').find('strong').text();
        
        // Create or update preview
        let preview = $('.winner-preview');
        if (preview.length === 0) {
            preview = $('<div class="winner-preview"></div>').insertAfter('.winner-options');
        }
        
        preview.html(`
            <div class="preview-content">
                <h4>🏆 Selected Winner: <strong>${winnerName}</strong></h4>
                <p>Click "Confirm Winner" to finalize this decision.</p>
            </div>
        `).addClass('show');
    }

    function initializeBulkActions() {
        // Enhanced bulk approve/reject with confirmation
        $('#approve-all').on('click', function() {
            showBulkActionModal('approve', 'Are you sure you want to approve all results?', function() {
                performBulkAction('approve');
            });
        });

        $('#reject-all').on('click', function() {
            showBulkActionModal('reject', 'Are you sure you want to reject all results?', function() {
                performBulkAction('reject');
            });
        });
    }

    function showBulkActionModal(action, message, callback) {
        const modal = $(`
            <div class="bulk-action-modal">
                <div class="modal-content">
                    <h3>${action.charAt(0).toUpperCase() + action.slice(1)} Results</h3>
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button class="btn btn-${action === 'approve' ? 'success' : 'danger'}" id="confirm-bulk">
                            Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}
                        </button>
                        <button class="btn btn-secondary" id="cancel-bulk">Cancel</button>
                    </div>
                </div>
            </div>
        `);

        $('body').append(modal);
        modal.fadeIn(200);

        modal.find('#confirm-bulk').on('click', function() {
            modal.fadeOut(200, function() { $(this).remove(); });
            callback();
        });

        modal.find('#cancel-bulk').on('click', function() {
            modal.fadeOut(200, function() { $(this).remove(); });
        });
    }

    function performBulkAction(action) {
        // Show loading state
        showLoadingSpinner('Processing bulk action...');
        
        // Simulate API call (replace with actual implementation)
        setTimeout(function() {
            hideLoadingSpinner();
            showToast(`All results ${action}ed successfully!`, action === 'approve' ? 'success' : 'warning');
        }, 1500);
    }

    function initializeKeyboardShortcuts() {
        // Global shortcuts for admin efficiency
        $(document).on('keydown', function(e) {
            // Ctrl/Cmd + Enter to confirm winner
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if ($('#set-winner').is(':enabled')) {
                    $('#set-winner').click();
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                $('.modal, .bulk-action-modal').fadeOut(200).remove();
            }
            
            // Alt + A for approve all
            if (e.altKey && e.key === 'a') {
                $('#approve-all').click();
            }
            
            // Alt + R for reject all
            if (e.altKey && e.key === 'r') {
                $('#reject-all').click();
            }
        });
    }

    function initializeAutoRefresh() {
        // Auto-refresh for real-time updates (optional)
        const autoRefreshInterval = 30000; // 30 seconds
        
        setInterval(function() {
            // Check if page is visible
            if (!document.hidden && $('.result-verification-container').length) {
                checkForUpdates();
            }
        }, autoRefreshInterval);
    }

    function checkForUpdates() {
        // Subtle check for new submissions or status changes
        // This would integrate with your backend API
        console.log('Checking for updates...');
    }

    // Utility functions
    function showLoadingSpinner(message) {
        const spinner = $(`
            <div class="loading-overlay">
                <div class="spinner-container">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            </div>
        `);
        $('body').append(spinner);
    }

    function hideLoadingSpinner() {
        $('.loading-overlay').fadeOut(200, function() {
            $(this).remove();
        });
    }

    function showToast(message, type = 'info') {
        const toast = $(`
            <div class="toast toast-${type}">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `);
        
        $('body').append(toast);
        
        setTimeout(() => {
            toast.addClass('show');
        }, 100);
        
        setTimeout(() => {
            hideToast(toast);
        }, 5000);
        
        toast.find('.toast-close').on('click', () => {
            hideToast(toast);
        });
    }

    function hideToast(toast) {
        toast.removeClass('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    // Enhanced screenshot modal functions
    window.openImageModal = function(src, caption) {
        const modal = $('#imageModal');
        const modalImg = $('#modalImage');
        const modalCaption = $('#modalCaption');
        
        modal.fadeIn(300);
        modalImg.attr('src', src);
        modalCaption.text(caption);
        
        // Add zoom functionality
        let scale = 1;
        modalImg.on('wheel', function(e) {
            e.preventDefault();
            const delta = e.originalEvent.deltaY;
            scale += delta > 0 ? -0.1 : 0.1;
            scale = Math.max(0.5, Math.min(3, scale));
            $(this).css('transform', `scale(${scale})`);
        });
        
        // Reset scale on modal close
        modal.on('hidden', function() {
            scale = 1;
            modalImg.css('transform', 'scale(1)');
        });
    };

    window.closeImageModal = function() {
        $('#imageModal').fadeOut(300);
    };

})(django.jQuery);

// Additional CSS for JavaScript-enhanced features
const additionalStyles = `
<style>
.zoomed {
    z-index: 100;
    transform: scale(1.1);
}

.comparison-mode {
    position: sticky;
    top: 20px;
    z-index: 50;
}

.winner-preview {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    text-align: center;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
}

.winner-preview.show {
    opacity: 1;
    transform: translateY(0);
}

.bulk-action-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.bulk-action-modal .modal-content {
    background: white;
    padding: 30px;
    border-radius: 10px;
    text-align: center;
    max-width: 400px;
    margin: 0 20px;
}

.modal-actions {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: center;
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.9);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
}

.spinner-container {
    text-align: center;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    z-index: 10002;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    gap: 10px;
}

.toast.show {
    transform: translateX(0);
}

.toast-success {
    border-left: 4px solid #28a745;
}

.toast-warning {
    border-left: 4px solid #ffc107;
}

.toast-info {
    border-left: 4px solid #17a2b8;
}

.toast-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
}

.annotation-point {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}
</style>
`;

// Inject additional styles
if (typeof document !== 'undefined') {
    document.head.insertAdjacentHTML('beforeend', additionalStyles);
}