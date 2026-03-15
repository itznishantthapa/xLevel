"""
Reusable admin filters for consistent behavior across all admin panels
"""
from django.contrib import admin
from django.utils import timezone
from datetime import timedelta


class TodayDefaultDateFilter(admin.SimpleListFilter):
    """
    Custom date filter that defaults to 'Today' for created_at field.
    Can be reused across different admin panels.
    """
    title = 'created at'
    parameter_name = 'created_at'

    def lookups(self, request, model_admin):
        return [
            ('today', 'Today'),
            ('past_7_days', 'Past 7 days'),
            ('this_month', 'This month'),
            ('this_year', 'This year'),
            ('all', 'Any date'),
        ]

    def queryset(self, request, queryset):
        now = timezone.now()
        
        if self.value() == 'today' or self.value() is None:  # Default to today
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            return queryset.filter(created_at__range=[start_of_day, end_of_day])
        elif self.value() == 'past_7_days':
            seven_days_ago = now - timedelta(days=7)
            return queryset.filter(created_at__gte=seven_days_ago)
        elif self.value() == 'this_month':
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(created_at__gte=start_of_month)
        elif self.value() == 'this_year':
            start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(created_at__gte=start_of_year)
        elif self.value() == 'all':
            return queryset
        
        return queryset
    
    def choices(self, changelist):
        """Override to set 'today' as default if no filter is selected"""
        for lookup, title in self.lookup_choices:
            selected = self.value() == lookup or (self.value() is None and lookup == 'today')
            yield {
                'selected': selected,
                'query_string': changelist.get_query_string({self.parameter_name: lookup}),
                'display': title,
            }


class TodayDefaultUpdatedAtFilter(TodayDefaultDateFilter):
    """
    Same as TodayDefaultDateFilter but for updated_at field
    """
    title = 'updated at'
    parameter_name = 'updated_at'

    def queryset(self, request, queryset):
        now = timezone.now()
        
        if self.value() == 'today' or self.value() is None:  # Default to today
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            return queryset.filter(updated_at__range=[start_of_day, end_of_day])
        elif self.value() == 'past_7_days':
            seven_days_ago = now - timedelta(days=7)
            return queryset.filter(updated_at__gte=seven_days_ago)
        elif self.value() == 'this_month':
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(updated_at__gte=start_of_month)
        elif self.value() == 'this_year':
            start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(updated_at__gte=start_of_year)
        elif self.value() == 'all':
            return queryset
        
        return queryset


class TodayDefaultReportedOnFilter(TodayDefaultDateFilter):
    """
    Same as TodayDefaultDateFilter but for reported_on field (used in Report model)
    """
    title = 'reported on'
    parameter_name = 'reported_on'

    def queryset(self, request, queryset):
        now = timezone.now()
        
        if self.value() == 'today' or self.value() is None:  # Default to today
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            return queryset.filter(reported_on__range=[start_of_day, end_of_day])
        elif self.value() == 'past_7_days':
            seven_days_ago = now - timedelta(days=7)
            return queryset.filter(reported_on__gte=seven_days_ago)
        elif self.value() == 'this_month':
            start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(reported_on__gte=start_of_month)
        elif self.value() == 'this_year':
            start_of_year = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            return queryset.filter(reported_on__gte=start_of_year)
        elif self.value() == 'all':
            return queryset
        
        return queryset