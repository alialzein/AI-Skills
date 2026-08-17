# Premises SQL Server schema

The per-client databases on a premises box, all prefixed with the client name
(`<Client>_BillingDB`, etc.). Structure is the same across clients — only the prefix
changes — so the tables and columns below hold for any premises client.

**This is the SQL Server premises deployment.** Do **not** confuse it with the repo's
`SCHEMA_REFERENCE.md`, which describes a *different* architecture: the ScriptLauncher app's
**PostgreSQL** sources (MontyMobile + hosted SAAS, lowercase columns like `createddate`,
`clientaccountid`) plus the hosted `BondSMSDb`/`SMSGatewayDB`. Premises columns are
**PascalCase** and keys are **`uniqueidentifier` (GUID)**, not ints.

Captured live (read-only, metadata only) against a reference client. Row counts are from that
box — indicative of scale, not exact for other clients. A few column sets are marked
**[columns pending]** because the box's SQL port went unreachable mid-capture; fill them with
the snippet below when it's back.

## How to (re)generate / extend this

Lock-free, no data reads:

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED; SET LOCK_TIMEOUT 8000;

-- tables + row counts in the current DB
SELECT t.name, SUM(CASE WHEN p.index_id IN (0,1) THEN p.rows ELSE 0 END) AS rows
FROM sys.tables t JOIN sys.partitions p ON p.object_id=t.object_id
GROUP BY t.name ORDER BY rows DESC;

-- columns of one table
SELECT ORDINAL_POSITION, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'TABLENAME' ORDER BY ORDINAL_POSITION;
```

Conventions below: **PK** marks the primary key; wide tables list the columns you actually
query and note `(+N more …)` for the audit/tax/exchange-rate/flag tail. Names come from
`BillingDB.dbo.Account` (client **and** vendor share this table), `dbo.Country`, `dbo.Operator`.

---

## Database map

| Database | Holds | ~tables |
|---|---|---|
| `*_BillingDB` | core billing, rate plans (`Route`, `CostPlanItem`), `WinServiceError`, **live CDR** (`CDR`, ~3 days) | 273 |
| `*_BillingDW` | warehouse — pre-aggregated stats (`FactStatistic`) + `Dim*` tables | 34 |
| `*_BPALCDRDB` | **CDR archive** — `CDRBackup` (partitioned, multi-TB), `MnpRequest` | 8 |
| `*_BondSMSDB` | SMS Portal — `Message`, `DeliveryReport`, accounts/companies/campaigns | 51 |
| `*_SMSGatewayDB` | SMS gateway — `Message`, MNP lookups, routing instructions | 50 |
| `*_GatewayConnectionDB` | connection logging (`ConnectionDetail`, `ConnectionSummary`) | 5 |
| `*_ClientPortalDB` | client-portal users/roles/permissions | 8 |
| `*_Integration` | route-sync integrator maps (account/operator/country) | 7 |
| `*_DNDDB` | do-not-disturb lists (often empty on a client) | 6 |
| `SSISDB` | SSIS catalog — CDR pipeline packages (see `diagnostic-queries.md` §9) | — |

Ignore the noise tables that show up in a raw listing: `*_backup*`, `*_deleted_YYYYMMDD`,
`tmp*`, `cdrstage_backup*`, `__RefactorLog`. They are ad-hoc copies, not part of the model.

---

## `*_BillingDB`

Biggest real tables: `CostPlanItem` (31M), `Integration_Master_Agent` (8.6M), `RouteHistory`
(4M), `CDR` (2M live), `WinServiceError` (1.3M), `CDRStage` (1.2M), `Route` (1M).

### Account  *(client AND vendor — joined twice per CDR/Route row)*
`AccountId` **PK**, `Name`, `AccountProfileId`, `CurrencyId`, `AccountType`(int),
`AccountStatus`(int), `AccountMode`(int), `AccountClass`(int), `AccountCategory`(int),
`BusinessType`(int), `PaymentType`(int), `PaymentTerm`(int), `DefaultRate`(float),
`TransitCost`/`TransitRate`(float), `AccountManagerId` + `…Name`/`…Email`, `SharedAccountId`,
`UserId`, `IsDeleted`(bit), `IsUpdated`(bit), `CreatedDate`, `ModifiedDate`
*(+ ~45 more: notification/invoice/daily-report toggles, vendor-cost auto-import config,
timezone + alert flags).*

### User  *(billing-application users; do not confuse with SQL logins)*
`UserId` **PK**, `Name`, `Username`, `Email`, `MobileNumber`, `AccountId`, `RoleId`,
`AccountProfileId`, `PartnerId`, `AccountManagerId`, `Active`(bit), `Locked`(bit),
`TwoFactorEnabled`(bit), `IsGoogleAuthenticatorEnabled`(bit), `DefaultTFA`(int),
`LoginAttempts`(int), `OTPAttempts`(int), `OTPSend`(int), `CreatedDate`, `LastLogin`,
`LastPasswordChange`.

The table also contains authentication material and binary/device fields. Never include
`Password`, `Token`, `GoogleAuthenticatorSecretKey`, `SecurityToken`, `PasswordChangeKey`,
`DeviceId`, or `Photo` in a routine user inventory or support report. See
`diagnostic-queries.md` §21 for a safe projection.

### Operator
`OperatorId` **PK**, `CountryId` (→ Country), `ZoneId`, `Name`, `MobileCountryCode`(int),
`MobileNetworkCode`(nvarchar), `Active`(bit), `IsExclusive`(bit), `IsUpdated`(bit),
`CreatedDate`, `ModifiedDate`. *Country is reached through the operator.*

### Country
`CountryId` **PK**, `Name`, `CountryCode`(int), `ISOCode`(nvarchar), `ZoneId`, `CreatedDate`,
`ModifiedDate`.

### Route  *(current routes; history in `RouteHistory` / `RouteHistoryArchive`)*
`RouteId` **PK**, `VendorAccountId`, `ClientAccountId`, `OperatorId`, `SourceOperatorId`,
`Rate`(float, cost side), `ClientRate`(float, selling — often equal to `Rate` on live rows),
`NewRate`, `RateFormula`, `Priority`(int), `BlendingVendorId2/3/4`, `BlendingPercentage1..4`,
`MessageCategory`, `RouteType`, `IsShared`, `IsMNPEnabled`, `RateStatus`, `CostStatus`,
`MNPCostStatus`, `IsPriceOnDelivery`, `IsCostOnDelivery`, `Locked`, `Blocked`, `Active`,
`Latest`, `RouteDeleted`, `EffectiveDate`, `CreatedDate`, `UpdatedDate`, `Comment`,
`InternalComment`. **`Latest`/`Active` are NULL on live rows — don't filter on them.**
*(Verified-present key columns; run the snippet for the complete list.)*

### CostPlanItem  *(vendor cost, keyed by vendor + operator; current = `Active = 1`)*
`CostPlanItemId` **PK**, `PlanSessionId`, `AccountId` (vendor), `OperatorId`,
`SourceOperatorId` (NULL on active rows), `Cost`(float), `NewCost`, `CostDifference`,
`CostStatus`(int), `Active`(bit), `EffectiveDate`, `CreatedDate`, `PrevCostPlanItemId`,
`RouteFeature`(int), `RouteQuality`(int), `IsRepriced`(bit), `UserId`, `Comment`,
`InternalComment`. Only ~1% of rows are active; one active row per (vendor, operator).

### CDR  *(live, ~3 days; clustered on `CreatedDate`. `CDRStage` and archive `CDRBackup` share this schema)*
`CDRId` **PK**, `CreatedDate`, `MessageId`, `OriginatingAddress`, `DestinationAddress`,
`Status`(int), `DeliveryStatus`(int), `ClientAccountId`, `VendorAccountId`, `SourceCountryId`,
`SourceOperatorId`, `DestinationCountryId`, `DestinationOperatorId`, `Cost`(float), `Rate`(float),
`TransitCost`, `TransitRate`, `MNPCost`, `HLRCost`, `CategoryId`, `ServiceProviderId`,
`CDRType`(int), `IsMNPRequest`(bit), `IsHLRRequest`(bit), `Blocked`, `IsDNDBlocked`,
`DLRVerified`, `Ported`, `SubmissionTime`, `DeliveryTime`, `UpdatedDate`
*(+ ~70 more: `_Cost`/`_Rate`/`_TransitCost` + `*ExchangeRate`, `Tax`/`SecondaryTax`/
`SupplierTax`, translation fields, `Gw*` ints, protocol, company IDs, flags).* Covering indexes
`(CreatedDate, <ClientAccountId|VendorAccountId|DestinationCountryId|DestinationOperatorId>)`.

### WinServiceError
`WinServiceErrorId` **PK**, `WinServiceId`, `CreatedDate`, `Message`. Grows fast; a naive
`COUNT`/scan here is a classic PLE killer (see case library).

### Notification
`NotificationId` **PK**, `AccountId`, `NotificationType`(int), `NotificationCategory`(int),
`NotificationStatus`(int), `DestinationAddress`, `OptionalDestinationAddress`, `Subject`,
`OriginalMessage`, `Message`, `File`(varbinary), `SourceEmail`+SMTP fields, `AccountProfileId`,
`CreatedDate`, `SentDate`, `NotificationActionStatus`.

### Invoice / InvoiceAccount
`Invoice`: `InvoiceId` **PK**, `Number`, `AccountType`(int), `CurrencyId`, `CurrencyRate`,
`Amount`, `ClientAmount`, `SupplierAmount`, `Tax`, `StartPeriod`/`EndPeriod`, `DueDate`,
`InvoiceStatus`(int), `DocumentId`/`DetailsDocumentId`/`MtDocumentId`, `CompanyId`,
`IsConfirmed`, `Paid`, `CreatedDate`, `UpdatedDate` *(+ more flags/document IDs)*.
`InvoiceAccount`: `InvoiceAccountId` **PK**, `InvoiceId`, `AccountId` (link table).

### PlanSession
`PlanSessionId` **PK**, `AccountId`, `DocumentId`, `Status`(int), `Name`, `SessionType`(int),
`SessionDate`, `EffectiveDate`, `CriticalError`, `ErrorDescription`, `CleanMode`, `IsDynamic`,
`UserId`.

### SubRoute
`SubRouteId` **PK**, `RouteId`, `VendorAccountId`, `Prefix`, `Content`, `IP`, `SourceNumber`,
`SourceNumberGroupId`, `DestinationNumberGroupId`, `Action`, `Priority`, `Blocked`, `Active`,
`RouteDeleted`, `MessageCategory`, `BlendingVendorId2/3/4`, `BlendingPercentage1..4`,
`IsCostOnDelivery`, `IsAlphanumeric`, `CreatedDate`, `UpdatedDate`, `UserId`.

### MNPRoute
`MNPRouteId` **PK**, `CountryId`, `OperatorId`, `ServiceProviderId`, `ServiceProviderType`(int),
`IsMNPEnabled`(bit), `CreatedDate`, `UpdatedDate`, `UserId`.

### Prefix
`PrefixId` **PK**, `OperatorId`, `OperatorName`, `OperatorCountryName`, `DestinationNumber`,
`MCCMNC`, `IMSI`, `PrefixNumber`, `Status`, `IsPorted`, `IsRoaming`, `Active`, `IsDeleted`,
`Count`(int), `CreatedDate` *(+ ported/roaming country/network prefix fields)*.

---

## `*_BillingDW`  (warehouse)

### FactStatistic  *(pre-aggregated; clustered on `Date`; each row already a group with a `Count`)*
`FactStatisticKey` **PK**, `Date`, `TimeStampHour`, `DateKey`, `FullDate`, **`Count`**(int),
`Cost`, `Rate`, `TransitCost`, `TransitRate`, `Profit`, `TotalCost`, `TotalRate`, `TotalProfit`,
`MNPCost`, `HLRCost`, denormalized names: `ClientName`(+`ClientAccountKey`),
`SupplierName`(vendor, +`Supplieraccountkey`), `SourceOperatorName`(+`SourceOperatorKey`),
`destinationOperatorName`(+`DestinationOperatorKey`), `SourceCountryName`(+`SourceCountryKey`),
`DestinationCountryName`(+`DestinationCountryKey`), `MessageStatus`, `DLRStatus`,
`DeliveryStatus`, `Status`, `ServiceProviderKey`, delivery buckets
`Delivered0s14s`…`DeliveredAfter48h` + `DeliveryAvgTime` *(+ ~40 more: `_Cost`/`_Rate` +
exchange rates, taxes, `IsMNPRequest`, `MigrationNeeded`)*. **No joins needed** — group by the
`*Name` columns. Note the vendor column is `SupplierName` and dest-operator is lowercase-d
`destinationOperatorName`.

### Dimensions  *(surrogate `<…>Key` + descriptive columns)* — [columns pending]
`DimClientAccount` (1041), `DimSupplierAccount` (972 — vendors), `DimDestinationCountry` /
`DimSourceCountry` (268 each), `DimDestinationOperator` / `DimSourceOperator` (1730 each),
`DimAccountManager` (33), `DimServiceProvider` (5), `DimDate` (52K).
Enum tables: `DLRStatus` / `MessageStatus` (`<enum> PK`, `enumtext`), `AccountType`, `AccountMode`,
`AccountClass`, `BusinessType`, `PaymentTerm`, `PaymentType`.
Pre-rolled traffic: `ClientTraffic` / `ClientCategoryTraffic` / `VendorTraffic` /
`VendorCategoryTraffic` (~170K each). [columns pending — capture with the snippet].

---

## `*_BPALCDRDB`  (CDR archive)

- **`CDRBackup`** — 675M+ rows, **partitioned by date**, same columns as `BillingDB.dbo.CDR`
  (above). Query only with a bounded `CreatedDate` range so partition elimination kicks in.
- **`MnpRequest`** — 105M rows, MNP lookup history. [columns pending] — expect
  `createddate`/request/response/status/messageid/number/serviceprovider/country/operator keys.

---

## `*_BondSMSDB`  (SMS Portal)  — [columns pending]

Real tables (verified): `Message` (16M), `DeliveryReport` (15M), `BalanceLog` (438K),
`Contact` (402K), `GroupContact` (348K), `BalanceHistory` (304K), `Signature` (301K),
`Prefix` (132K), `AccountCountry` (25K), `AuditTrail`, `Campaign`, `CampaignDetail`,
`CampaignSession`, `Operator`, `CompanyRate`, `AllowedSender`, `Country`, `CustomRate`, `Rate`,
`User`, `Account`, `Transaction`, `Api`, `Permission`, `Group`, `Vendor`, `CompanyVendor`,
`Company`, `SystemConfiguration`, `Template`, `CountryDND`, `Voucher`, …

Same product as the hosted `BondSMSDb` in `SCHEMA_REFERENCE.md` — likely the same shape, but
**verify columns on the box before relying on them**. Known/cross-referenced key columns:
`Message`(`ReceivedDate`, `Status` [0=NotProcessed, 8=NotSent], `accountId`),
`Account`(`accountid` PK, `firstname`, `companyid`), `Company`(`companyid` PK, `name`,
`companyinfoid`), `Campaign`(`campaignid` PK, `name`, `accountid`, `userid`, `content`, `State`,
`SMSCount`, `handledcount`), `User`(`userid` PK, `username`, `accountid`), `Vendor`(`VendorId`
PK, `Username`), `AllowedSender`(`accountid`).

---

## `*_SMSGatewayDB`  (SMS gateway)  — [columns pending]

Real tables (verified): `MnpLookUp` (40M), `ThrottlingLog` (15.6M), `Message` (13M),
`MNPQueryHistory` (359K), `RoutingInstruction` (321K), `UpdateTracker`, `Prefix`,
`ContentReplacePattern`, `MnpCountry`, `ContentTranslation`, `MNC`, `ConnectionProfile`,
`Application_ConnectionProfile`, `Operator`, `Macro`, `Application`, `MnpServiceProvider`, …

Same product as the hosted `SMSGatewayDB` in `SCHEMA_REFERENCE.md`. Known/cross-referenced:
`Message`(`MessageID` PK, `ApplicationID`, `DateReceived`, `DateSent`, `DateDLR`, `MessageStage`
[1=received], `OriginalMessageText`, `MessageText`), `Application`(`ApplicationID` PK,
`ApplicationName`). Join `Message.ApplicationID = Application.ApplicationID`.

---

## `*_GatewayConnectionDB`  — [columns pending]

`ConnectionDetail` (16.6M), `ConnectionSummary` (8.5K), `Api` (9), `GatewayInstance` (1),
`Gateway` (1). Connection-level logging.

## `*_ClientPortalDB`  — [columns pending]

`AccountProfilePermission` (1.6K), `RolePermission`, `Permission`, `ReportRequest`, `User`,
`Role`, `PermissionAction`. Portal auth/RBAC + report requests.

## `*_Integration`  — [columns pending]

`AccountIntegrator` (1.9K), `OperatorIntegrator` (1.7K), `CountryIntegrator` (1.7K),
`StatusIntegrator`, `DLRIntegrator`, `SupplierTelestaxIntegrator`, `ClientTelestaxIntegrator`.
Maps this platform's account/operator/country IDs to a partner's (route-sync / Telestax).

## `*_DNDDB`  — [columns pending]

`DNDNumbers`, `SenderContentSafe`, `SenderConnectionProfileSafe`, `Log`, `Admin` — usually
empty on a client; populated only where DND enforcement is on.
