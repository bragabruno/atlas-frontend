{{/*
Expand the chart name.
*/}}
{{- define "atlas-frontend.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
Truncate at 63 chars because some Kubernetes name fields are limited.
*/}}
{{- define "atlas-frontend.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart label value.
*/}}
{{- define "atlas-frontend.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to every resource.
*/}}
{{- define "atlas-frontend.labels" -}}
helm.sh/chart: {{ include "atlas-frontend.chart" . }}
{{ include "atlas-frontend.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels — used by Service selectors and Rollout pod selectors.
*/}}
{{- define "atlas-frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "atlas-frontend.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
ServiceAccount name.
*/}}
{{- define "atlas-frontend.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "atlas-frontend.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
