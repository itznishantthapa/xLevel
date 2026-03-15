from django.contrib import admin, messages
from django.urls import path
from django import forms
from django.shortcuts import render, redirect
from django.utils import timezone
from datetime import datetime
from info.admin_base import LoggingModelAdmin

from access.models import AccessCode


class AccessCodeAdminForm(forms.ModelForm):
	class Meta:
		model = AccessCode
		fields = [
			"code",
			"max_usage",
			"used_count",
			"expires_at",
			"is_active",
		]

	def clean(self):
		cleaned = super().clean()
		max_usage = cleaned.get("max_usage") or 0
		used_count = cleaned.get("used_count") or 0
		if used_count > max_usage:
			self.add_error("used_count", "Used count cannot exceed max usage.")
		return cleaned


class BulkUploadForm(forms.Form):
	codes = forms.CharField(
		widget=forms.Textarea(attrs={"rows": 8, "placeholder": "CODE1, CODE2, CODE3, ..."}),
		help_text="Comma-separated list of codes (no limit on count). Each code up to 20 characters."
	)
	max_usage = forms.IntegerField(min_value=1, initial=1)
	expires_at = forms.DateField(
		required=False,
		help_text="Optional.",
		widget=forms.DateInput(attrs={"type": "date"})
	)
	is_active = forms.BooleanField(required=False, initial=True)

	def clean_codes(self):
		text = self.cleaned_data["codes"].strip()
		if not text:
			raise forms.ValidationError("Codes are required.")
		# Parse
		codes = [c.strip().upper() for c in text.split(",") if c.strip()]
		# Validate length
		too_long = [c for c in codes if len(c) > 20]
		if too_long:
			raise forms.ValidationError(f"Codes too long (>{20} chars): {', '.join(too_long[:3])}...")
		return codes


@admin.register(AccessCode)
class AccessCodeAdmin(LoggingModelAdmin):
	form = AccessCodeAdminForm
	change_list_template = "admin/access/accesscode/change_list.html"
	list_display = (
		"code",
		"max_usage",
		"used_count",
		"remaining_usage",
		"is_active",
		"expires_at",
		"created_at",
	)
	list_filter = ("is_active", "expires_at", "created_at")
	search_fields = ("code",)
	ordering = ("-created_at",)
	list_editable = ("max_usage", "is_active")
	readonly_fields = ("created_at",)
	fieldsets = (
		(None, {
			"fields": ("code", "max_usage", "used_count", "is_active", "expires_at")
		}),
		("System", {
			"fields": ("created_at",),
		}),
	)

	actions = [
		"activate_codes",
		"deactivate_codes",
		"reset_usage",
	]

	def remaining_usage(self, obj):
		return max(0, obj.max_usage - obj.used_count)
	remaining_usage.short_description = "Remaining"

	def activate_codes(self, request, queryset):
		updated = queryset.update(is_active=True)
		self.message_user(request, f"Activated {updated} codes.", level=messages.SUCCESS)

	def deactivate_codes(self, request, queryset):
		updated = queryset.update(is_active=False)
		self.message_user(request, f"Deactivated {updated} codes.", level=messages.WARNING)

	def reset_usage(self, request, queryset):
		updated = queryset.update(used_count=0)
		self.message_user(request, f"Reset usage for {updated} codes.", level=messages.SUCCESS)

	# Custom URLs for bulk upload
	def get_urls(self):
		urls = super().get_urls()
		custom = [
			path("upload/", self.admin_site.admin_view(self.upload_view), name="access_accesscode_upload"),
		]
		return custom + urls

	def upload_view(self, request):
		if request.method == "POST":
			form = BulkUploadForm(request.POST)
			if form.is_valid():
				codes = form.cleaned_data["codes"]
				max_usage = form.cleaned_data["max_usage"]
				expires_at_date = form.cleaned_data.get("expires_at")
				is_active = form.cleaned_data.get("is_active", True)
				# Convert date to timezone-aware datetime at end of day
				expires_at = None
				if expires_at_date:
					expires_at = timezone.make_aware(
						datetime.combine(expires_at_date, datetime.max.time())
					)

				created, skipped = [], []
				for code in codes:
					if AccessCode.objects.filter(code=code).exists():
						skipped.append(code)
						continue
					AccessCode.objects.create(
						code=code,
						max_usage=max_usage,
						expires_at=expires_at,
						is_active=is_active,
					)
					created.append(code)

				if created:
					self.message_user(request, f"Created {len(created)} codes.", level=messages.SUCCESS)
				if skipped:
					self.message_user(request, f"Skipped {len(skipped)} duplicates.", level=messages.WARNING)
				return redirect("..")
		else:
			form = BulkUploadForm()

		context = {
			**self.admin_site.each_context(request),
			"opts": self.model._meta,
			"form": form,
			"title": "Bulk upload access codes",
		}
		return render(request, "admin/access/accesscode/upload.html", context)
