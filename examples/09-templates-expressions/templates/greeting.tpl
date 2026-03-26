Hello {{ .vars.name }}!
Welcome to {{ .vars.app_name }}.
Environment: {{ upper (toString .vars.environment) }}
