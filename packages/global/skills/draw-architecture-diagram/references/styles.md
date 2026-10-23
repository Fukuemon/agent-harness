# draw.io のスタイルの文字列

viewer.diagrams.net の viewer-static.min.js で描画できることを確かめた文字列である。グループとアイコンの名前は、draw.io の図形のライブラリ（AWS の `mxgraph.aws4`、Kubernetes の `mxgraph.kubernetes`）の名前と同じである。

## 線

```text
edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;endArrow=open;endSize=8;strokeWidth=1.5;fontSize=12;labelBackgroundColor=#FFFFFF;
```

- 破線は `dashed=1;` を足す。色は `strokeColor=` で足す。
- 出る位置と入る位置は `exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;` の形で書く。値は 0 から 1 の割合である。
- 経由点は `<mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="" y=""/></Array></mxGeometry>` に絶対の座標で書く。

## AWS のグループ

共通の部分:

```text
points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;shape=mxgraph.aws4.group;verticalAlign=top;align=left;spacingLeft=30;dashed=0;
```

共通の部分の後に、次を足す。

| グループ | 足す文字列 |
| --- | --- |
| AWS Cloud | `grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;fontColor=#232F3E;` |
| アカウント | `grIcon=mxgraph.aws4.group_account;strokeColor=#CD2264;fillColor=none;fontColor=#CD2264;` |
| リージョン | `grIcon=mxgraph.aws4.group_region;strokeColor=#00A4A6;fillColor=none;fontColor=#147EBA;dashed=1;` |
| VPC | `grIcon=mxgraph.aws4.group_vpc2;strokeColor=#8C4FFF;fillColor=none;fontColor=#8C4FFF;` |
| private subnet | `grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#00A4A6;fillColor=#E6F6F7;fontColor=#147EBA;` |

AWS に無い枠（EKS の cluster、リポジトリの境界）は、次の文字列に `strokeColor=` を足す。

```text
rounded=0;whiteSpace=wrap;html=1;fillColor=none;container=1;collapsible=0;recursiveResize=0;verticalAlign=top;align=left;spacingLeft=8;fontSize=12;
```

## AWS のリソースのアイコン

```text
sketch=0;outlineConnect=0;fontColor=#16191F;gradientColor=none;strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.resourceIcon;whiteSpace=nowrap;
```

この後に `resIcon=mxgraph.aws4.<名前>;fillColor=<色>;` を足す。色はサービスの分類の色で、変えない。

| サービス | 名前 | 色 |
| --- | --- | --- |
| Amazon RDS | `rds` | `#C925D1` |
| Amazon ElastiCache | `elasticache` | `#C925D1` |
| Amazon S3 | `s3` | `#7AA116` |
| AWS Secrets Manager | `secrets_manager` | `#DD344C` |
| AWS KMS | `key_management_service` | `#DD344C` |
| IAM | `identity_and_access_management` | `#DD344C` |
| AWS Certificate Manager | `certificate_manager` | `#DD344C` |
| Amazon Route 53 | `route_53` | `#8C4FFF` |
| Amazon VPC | `vpc` | `#8C4FFF` |
| Amazon EKS | `eks` | `#ED7100` |
| Amazon ECR | `ecr` | `#ED7100` |
| Amazon CloudWatch | `cloudwatch_2` | `#E7157B` |

`resourceIcon` ではなく、図形そのものを使うもの:

| 図形 | 文字列 |
| --- | --- |
| Application Load Balancer | `shape=mxgraph.aws4.application_load_balancer;fillColor=#8C4FFF;strokeColor=none;` |
| VPC Peering | `shape=mxgraph.aws4.peering;fillColor=#8C4FFF;strokeColor=none;` |
| 利用者 | `shape=mxgraph.aws4.users;fillColor=#232F3D;strokeColor=none;` |

この 3 つにも、ラベルの位置を足す。

```text
verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;aspect=fixed;whiteSpace=nowrap;
```

## Kubernetes のアイコン

```text
aspect=fixed;sketch=0;html=1;dashed=0;fillColor=#2875E2;strokeColor=#ffffff;shape=mxgraph.kubernetes.icon;verticalLabelPosition=bottom;verticalAlign=top;fontSize=12;whiteSpace=nowrap;fontColor=#16191F;prIcon=<名前>;
```

名前は `pod`、`job`、`deploy`、`secret`、`ns` を確かめた。namespace の枠は、次の文字列にする。

```text
rounded=1;arcSize=2;fillColor=#EAF1FB;strokeColor=#326CE5;dashed=1;container=1;collapsible=0;recursiveResize=0;verticalAlign=top;align=left;spacingLeft=8;fontSize=12;
```

## 吹き出しと AWS の外のもの

| 用途 | 文字列 |
| --- | --- |
| 吹き出し（付箋） | `shape=note;size=10;whiteSpace=wrap;html=1;fillColor=#FFF8E1;strokeColor=#B8860B;fontSize=12;align=left;verticalAlign=top;spacingLeft=6;spacingTop=4;` |
| AWS の外のサービス | `rounded=1;whiteSpace=wrap;html=1;fillColor=#F2F3F3;strokeColor=#7D8998;fontSize=12;` |
| タイトルと凡例の文 | `text;html=1;align=left;verticalAlign=top;fontSize=12;whiteSpace=wrap;` |

- アイコンのラベルの位置を右にするときは、`labelPosition=right;verticalLabelPosition=middle;align=left;verticalAlign=middle;spacingLeft=4;` にする。下に置くと、下へ出る線がラベルを通るときに使う。
