# 自动添加 reviewer

将开始结束符号内，所有的 @xxx 添加到 reviewer 里：

```markdown
<!-- Record Reviewer -->
@VisualSJ @test
<!-- End Reviewer -->
```

## Inputs

### `token`

**Required** 当前用户的 token

## Example usage

```yaml
uses: VisualSJ/action-auto-reviewer@v1
with:
  token: ${{ secrets.GITHUB_TOKEN }}
```
